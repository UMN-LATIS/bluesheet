<?php

use App\Console\Commands\ImportSisData;
use App\Group;
use App\LocalClassSection;
use App\LocalCourse;
use App\SisCourse;
use App\SisClassSection;
use App\SisEmployee;
use App\User;
use Database\Seeders\TestDatabaseSeeder;
use Illuminate\Support\Facades\Schema;

use function Pest\Laravel\{actingAs, deleteJson, getJson, postJson, putJson};

/** Summer 2027: the first term the SIS has not published, so the first one plannable. */
const PLANNABLE_TERM = 1275;

/** Spring 2027: the SIS has published it, so the schedulers no longer own it. */
const PUBLISHED_TERM = 1273;

const DEPT = 11111;

beforeEach(function () {
    $this->seed(TestDatabaseSeeder::class);

    $this->group = Group::factory()->create(['dept_id' => (string) DEPT]);
    $this->admin = User::where('umndid', 'admin')->first();
    $this->basicUser = User::where('umndid', 'basic_user')->first();
});

/** A planned section in this group's department, with the given overrides. */
function plannedSection(array $attributes = []): LocalClassSection {
    return LocalClassSection::factory()->create([
        'academic_org' => DEPT,
        'term_code' => PLANNABLE_TERM,
        ...$attributes,
    ]);
}

/** What the SIS having published a term looks like: one section is enough. */
function publishTermInSis(int $termCode = PUBLISHED_TERM): void {
    SisClassSection::factory()->create(['academic_org' => DEPT, 'term_code' => $termCode]);
}

/** The body the page sends, which is the section shape it already renders. */
function sectionPayload(array $overrides = []): array {
    return [
        'termId' => PLANNABLE_TERM,
        'courseCode' => 'ANTH-1001',
        'subject' => 'ANTH',
        'catalogNumber' => '1001',
        'section' => '001',
        'component' => 'LEC',
        'title' => 'Human Evolution',
        'credits' => 3,
        'enrollmentCap' => 40,
        'delivery' => 'onCampus',
        'notes' => '',
        'isCancelled' => false,
        'meetings' => [[
            'days' => ['mon', 'wed', 'fri'],
            'startTime' => '10:10',
            'endTime' => '11:00',
        ]],
        'instructors' => [],
        ...$overrides,
    ];
}

function sectionsUrl(Group $group): string {
    return "/api/term-planning/groups/{$group->id}/sections";
}

describe('GET /api/term-planning/groups/:groupId/sections', function () {
    it('reports a term the SIS has not published as editable', function () {
        actingAs($this->admin);
        $res = getJson(sectionsUrl($this->group) . '?term=' . PLANNABLE_TERM);

        expect($res->status())->toBe(200);
        expect($res->json('isEditable'))->toBeTrue();
    });

    it('reports a term the SIS has published as no longer editable', function () {
        publishTermInSis();

        actingAs($this->admin);
        $res = getJson(sectionsUrl($this->group) . '?term=' . PUBLISHED_TERM);

        expect($res->json('isEditable'))->toBeFalse();
    });

    it('judges each term on its own, not on the department as a whole', function () {
        publishTermInSis(PUBLISHED_TERM);

        actingAs($this->admin);
        $res = getJson(sectionsUrl($this->group) . '?term=' . PLANNABLE_TERM);

        expect($res->json('isEditable'))->toBeTrue();
    });

    it('returns a planned section in the shape the grid already reads', function () {
        $section = plannedSection([
            'subject' => 'ANTH',
            'catalog_number' => '1001',
            'title' => 'Human Evolution',
            'notes' => 'room with a projector',
        ]);
        $section->meetings()->create([
            'starts_at' => '10:10:00',
            'ends_at' => '11:00:00',
            'meets_monday' => true,
            'meets_wednesday' => true,
            'meets_friday' => true,
        ]);
        SisEmployee::factory()->create(['emplid' => 4242, 'full_name' => 'Ana García']);
        $section->instructors()->create(['emplid' => 4242, 'role' => 'PI']);

        actingAs($this->admin);
        $res = getJson(sectionsUrl($this->group) . '?term=' . PLANNABLE_TERM);

        expect($res->json('sections'))->toHaveCount(1);
        expect($res->json('sections.0'))->toMatchArray([
            'id' => $section->id,
            // the SIS assigns class numbers and has not seen this section
            'classNumber' => null,
            'termId' => PLANNABLE_TERM,
            'courseCode' => 'ANTH-1001',
            'section' => '001',
            'title' => 'Human Evolution',
            'delivery' => 'onCampus',
            'notes' => 'room with a projector',
            'isCancelled' => false,
            'crosslist' => null,
        ]);
        expect($res->json('sections.0.meetings'))->toBe([[
            'days' => ['mon', 'wed', 'fri'],
            'startTime' => '10:10',
            'endTime' => '11:00',
        ]]);
        expect($res->json('sections.0.instructors.0.name'))->toBe('Ana García');
    });

    it('leaves out sections planned for another term or another department', function () {
        plannedSection(['subject' => 'ANTH', 'catalog_number' => '1001']);
        plannedSection(['term_code' => 1279, 'subject' => 'ANTH', 'catalog_number' => '2001']);
        plannedSection(['academic_org' => 22222, 'subject' => 'HIST', 'catalog_number' => '1001']);

        actingAs($this->admin);
        $res = getJson(sectionsUrl($this->group) . '?term=' . PLANNABLE_TERM);

        expect(collect($res->json('sections'))->pluck('courseCode')->all())->toBe(['ANTH-1001']);
    });

    it('leaves out a section that was deleted', function () {
        plannedSection()->delete();

        actingAs($this->admin);
        $res = getJson(sectionsUrl($this->group) . '?term=' . PLANNABLE_TERM);

        expect($res->json('sections'))->toBe([]);
    });

    it('requires the user to have read privileges', function () {
        actingAs($this->basicUser);
        $res = getJson(sectionsUrl($this->group) . '?term=' . PLANNABLE_TERM);

        expect($res->status())->toBe(403);
    });
});

describe('POST /api/term-planning/groups/:groupId/sections', function () {
    it('saves a planned section with its meetings', function () {
        actingAs($this->admin);
        $res = postJson(sectionsUrl($this->group), sectionPayload());

        expect($res->status())->toBe(201);
        expect($res->json('courseCode'))->toBe('ANTH-1001');
        expect($res->json('meetings.0.days'))->toBe(['mon', 'wed', 'fri']);

        $section = LocalClassSection::sole();
        expect($section->academic_org)->toBe(DEPT);
        expect($section->created_by)->toBe($this->admin->id);
    });

    it('survives a reload, which is the whole point', function () {
        actingAs($this->admin);
        postJson(sectionsUrl($this->group), sectionPayload());

        $res = getJson(sectionsUrl($this->group) . '?term=' . PLANNABLE_TERM);

        expect($res->json('sections.0.title'))->toBe('Human Evolution');
    });

    it('refuses a term the SIS has published, whatever the page is showing', function () {
        publishTermInSis();

        actingAs($this->admin);
        $res = postJson(sectionsUrl($this->group), sectionPayload(['termId' => PUBLISHED_TERM]));

        expect($res->status())->toBe(403);
        expect(LocalClassSection::count())->toBe(0);
    });

    it('requires the user to have edit privileges', function () {
        actingAs($this->basicUser);
        $res = postJson(sectionsUrl($this->group), sectionPayload());

        expect($res->status())->toBe(403);
        expect(LocalClassSection::count())->toBe(0);
    });

    it('refuses a delivery the front end has no name for', function () {
        actingAs($this->admin);
        $res = postJson(sectionsUrl($this->group), sectionPayload(['delivery' => 'telepathy']));

        expect($res->status())->toBe(422);
    });

    it('refuses a meeting that ends before it starts', function () {
        actingAs($this->admin);
        $res = postJson(sectionsUrl($this->group), sectionPayload([
            'meetings' => [['days' => ['mon'], 'startTime' => '11:00', 'endTime' => '10:10']],
        ]));

        expect($res->status())->toBe(422);
    });

    it('refuses a second section with the same number in the same term', function () {
        actingAs($this->admin);
        postJson(sectionsUrl($this->group), sectionPayload());
        $res = postJson(sectionsUrl($this->group), sectionPayload());

        expect($res->status())->toBe(422);
        expect($res->json('errors'))->toHaveKey('section');
        expect(LocalClassSection::count())->toBe(1);
    });

    it('allows the same section number on a different course', function () {
        actingAs($this->admin);
        postJson(sectionsUrl($this->group), sectionPayload());
        $res = postJson(sectionsUrl($this->group), sectionPayload([
            'courseCode' => 'ANTH-2001',
            'catalogNumber' => '2001',
        ]));

        expect($res->status())->toBe(201);
    });
});

describe('PUT /api/term-planning/groups/:groupId/sections/:id', function () {
    it('replaces the section and its meetings', function () {
        $section = plannedSection(['subject' => 'ANTH', 'catalog_number' => '1001']);
        $section->meetings()->create(['starts_at' => '09:00:00', 'ends_at' => '09:50:00', 'meets_monday' => true]);

        actingAs($this->admin);
        $res = putJson(sectionsUrl($this->group) . "/{$section->id}", sectionPayload([
            'title' => 'Human Evolution, revised',
            'notes' => 'moved later',
        ]));

        expect($res->status())->toBe(200);
        expect($res->json('title'))->toBe('Human Evolution, revised');
        expect($res->json('meetings'))->toHaveCount(1);
        expect($res->json('meetings.0.startTime'))->toBe('10:10');
        expect($section->fresh()->updated_by)->toBe($this->admin->id);
    });

    it('records an audit entry, so a change has an author and a before', function () {
        // laravel-auditing skips anything running in the console, which is
        // every test, so the real app's behaviour has to be asked for here
        config(['audit.console' => true]);

        $section = plannedSection(['title' => 'Human Evolution']);

        actingAs($this->admin);
        putJson(sectionsUrl($this->group) . "/{$section->id}", sectionPayload([
            'title' => 'Human Evolution, revised',
        ]));

        $audit = $section->audits()->where('event', 'updated')->sole();
        expect($audit->user_id)->toBe($this->admin->id);
        expect($audit->old_values['title'])->toBe('Human Evolution');
        expect($audit->new_values['title'])->toBe('Human Evolution, revised');
    });

    it('lets a section keep its own number', function () {
        $section = plannedSection(['subject' => 'ANTH', 'catalog_number' => '1001', 'class_section' => '001']);

        actingAs($this->admin);
        $res = putJson(sectionsUrl($this->group) . "/{$section->id}", sectionPayload(['title' => 'Renamed']));

        expect($res->status())->toBe(200);
    });

    it('refuses to move a section into another term', function () {
        $section = plannedSection();

        actingAs($this->admin);
        $res = putJson(sectionsUrl($this->group) . "/{$section->id}", sectionPayload(['termId' => 1279]));

        expect($res->status())->toBe(422);
    });

    it('refuses once the SIS has published the section\'s term', function () {
        $section = plannedSection(['term_code' => PUBLISHED_TERM]);
        publishTermInSis();

        actingAs($this->admin);
        $res = putJson(sectionsUrl($this->group) . "/{$section->id}", sectionPayload([
            'termId' => PUBLISHED_TERM,
            'title' => 'Too late',
        ]));

        expect($res->status())->toBe(403);
        expect($section->fresh()->title)->not->toBe('Too late');
    });

    it('cannot reach a section belonging to another department', function () {
        $section = plannedSection(['academic_org' => 22222]);

        actingAs($this->admin);
        $res = putJson(sectionsUrl($this->group) . "/{$section->id}", sectionPayload());

        expect($res->status())->toBe(404);
    });

    it('requires the user to have edit privileges', function () {
        $section = plannedSection(['title' => 'Human Evolution']);

        actingAs($this->basicUser);
        $res = putJson(sectionsUrl($this->group) . "/{$section->id}", sectionPayload(['title' => 'Nope']));

        expect($res->status())->toBe(403);
        expect($section->fresh()->title)->toBe('Human Evolution');
    });
});

describe('DELETE /api/term-planning/groups/:groupId/sections/:id', function () {
    it('removes the section from the plan but keeps the row', function () {
        $section = plannedSection();

        actingAs($this->admin);
        $res = deleteJson(sectionsUrl($this->group) . "/{$section->id}");

        expect($res->status())->toBe(204);
        expect(LocalClassSection::count())->toBe(0);
        expect(LocalClassSection::withTrashed()->count())->toBe(1);
    });

    it('frees the section number for reuse', function () {
        $section = plannedSection(['subject' => 'ANTH', 'catalog_number' => '1001', 'class_section' => '001']);

        actingAs($this->admin);
        deleteJson(sectionsUrl($this->group) . "/{$section->id}");
        $res = postJson(sectionsUrl($this->group), sectionPayload(['section' => '001']));

        expect($res->status())->toBe(201);
    });

    it('leaves the course in place when its last section goes', function () {
        $course = LocalCourse::factory()->create([
            'academic_org' => DEPT,
            'subject' => 'ANTH',
            'catalog_number' => '3999',
        ]);
        $section = plannedSection(['subject' => 'ANTH', 'catalog_number' => '3999']);

        actingAs($this->admin);
        deleteJson(sectionsUrl($this->group) . "/{$section->id}");

        // a course named by hand is worth more than the section that prompted
        // it: the next term still has to be able to pick it
        expect($course->fresh())->not->toBeNull();
        expect(getJson(coursesUrl($this->group))->json())->toHaveCount(1);
    });

    it('refuses once the SIS has published the section\'s term', function () {
        $section = plannedSection(['term_code' => PUBLISHED_TERM]);
        publishTermInSis();

        actingAs($this->admin);
        $res = deleteJson(sectionsUrl($this->group) . "/{$section->id}");

        expect($res->status())->toBe(403);
        expect(LocalClassSection::count())->toBe(1);
    });

    it('requires the user to have edit privileges', function () {
        $section = plannedSection();

        actingAs($this->basicUser);
        $res = deleteJson(sectionsUrl($this->group) . "/{$section->id}");

        expect($res->status())->toBe(403);
        expect(LocalClassSection::count())->toBe(1);
    });
});

function coursesUrl(Group $group): string {
    return "/api/term-planning/groups/{$group->id}/courses";
}

describe('GET /api/term-planning/groups/:groupId/courses', function () {
    it('lists the SIS catalogue and the courses a scheduler named, marked apart', function () {
        SisCourse::factory()->create([
            'academic_org' => DEPT,
            'subject' => 'ANTH',
            'catalog_number' => '1001',
            'title' => 'Human Evolution',
        ]);
        LocalCourse::factory()->create([
            'academic_org' => DEPT,
            'subject' => 'ANTH',
            'catalog_number' => '3999',
            'title' => 'Field Methods',
        ]);

        actingAs($this->admin);
        $res = getJson(coursesUrl($this->group));

        expect($res->status())->toBe(200);
        expect(collect($res->json())->pluck('source', 'courseCode')->all())->toBe([
            'ANTH-1001' => 'sis',
            'ANTH-3999' => 'local',
        ]);
    });

    it('leaves out another department\'s courses', function () {
        SisCourse::factory()->create(['academic_org' => DEPT, 'subject' => 'ANTH', 'catalog_number' => '1001']);
        SisCourse::factory()->create(['academic_org' => 22222, 'subject' => 'HIST', 'catalog_number' => '1001']);
        LocalCourse::factory()->create(['academic_org' => 22222, 'subject' => 'HIST', 'catalog_number' => '3999']);

        actingAs($this->admin);
        $res = getJson(coursesUrl($this->group));

        expect(collect($res->json())->pluck('courseCode')->all())->toBe(['ANTH-1001']);
    });

    it('requires the user to have read privileges', function () {
        actingAs($this->basicUser);

        expect(getJson(coursesUrl($this->group))->status())->toBe(403);
    });
});

describe('POST /api/term-planning/groups/:groupId/courses', function () {
    $payload = [
        'subject' => 'anth',
        'catalogNumber' => '3999',
        'title' => 'Field Methods',
        'credits' => 4,
    ];

    it('names a course the SIS has never published', function () use ($payload) {
        actingAs($this->admin);
        $res = postJson(coursesUrl($this->group), $payload);

        expect($res->status())->toBe(201);
        expect($res->json())->toMatchArray([
            'courseCode' => 'ANTH-3999',
            'subject' => 'ANTH',
            'title' => 'Field Methods',
            'source' => 'local',
            'lastOfferedTermId' => null,
        ]);

        $course = LocalCourse::sole();
        expect($course->academic_org)->toBe(DEPT);
        expect($course->created_by)->toBe($this->admin->id);
    });

    it('refuses a course the department already has locally', function () use ($payload) {
        LocalCourse::factory()->create([
            'academic_org' => DEPT,
            'subject' => 'ANTH',
            'catalog_number' => '3999',
        ]);

        actingAs($this->admin);
        $res = postJson(coursesUrl($this->group), $payload);

        expect($res->status())->toBe(422);
        expect(LocalCourse::count())->toBe(1);
    });

    it('refuses a course the SIS already publishes', function () use ($payload) {
        // a local row would never win the union, so it would vanish on save
        SisCourse::factory()->create([
            'academic_org' => DEPT,
            'subject' => 'ANTH',
            'catalog_number' => '3999',
        ]);

        actingAs($this->admin);
        $res = postJson(coursesUrl($this->group), $payload);

        expect($res->status())->toBe(422);
        expect(LocalCourse::count())->toBe(0);
    });

    it('requires the user to have edit privileges', function () use ($payload) {
        actingAs($this->basicUser);
        $res = postJson(coursesUrl($this->group), $payload);

        expect($res->status())->toBe(403);
        expect(LocalCourse::count())->toBe(0);
    });
});

/** Every table the local plan lives in. */
const LOCAL_TABLES = [
    'local_courses',
    'local_class_sections',
    'local_class_meetings',
    'local_class_instructors',
];

describe('the local tables and the nightly rebuild', function () {
    it('keeps the local tables out of the tables import:sis swaps', function () {
        // the command drops and recreates every table it lists, so a local
        // table in that list would be emptied every night
        $swapped = (new ReflectionClass(ImportSisData::class))->getConstant('TABLES');

        expect(array_intersect($swapped, LOCAL_TABLES))->toBe([]);
    });

    it('points no local foreign key into the sis_ mirror', function () {
        // import:sis re-adds the mirror's foreign keys against the _tmp copies
        // before the swap. A constraint reaching in from outside would not be
        // rebuilt, and would be left referencing the displaced tables.
        foreach (LOCAL_TABLES as $table) {
            foreach (Schema::getForeignKeys($table) as $foreignKey) {
                expect($foreignKey['foreign_table'])->not->toStartWith('sis_');
            }
        }
    });
});

describe('GET /api/term-planning/groups/:groupId/course-instructors', function () {
    /**
     * Someone the SIS recorded on a section of `$courseCode` in `$termCode`.
     * The employee comes first: sis_class_instructors.emplid is a foreign key
     * into sis_employees, unlike its local_ counterpart.
     */
    function taught(int $emplid, string $role, string $courseCode, int $termCode): void {
        SisEmployee::firstOrCreate(
            ['emplid' => $emplid],
            SisEmployee::factory()->make()->only(['first_name', 'last_name', 'internet_id']),
        );

        $section = SisClassSection::factory()->create([
            'academic_org' => DEPT,
            'term_code' => $termCode,
            'course_code' => $courseCode,
        ]);

        $section->instructors()->create(['emplid' => $emplid, 'role' => $role]);
    }

    function historyUrl(Group $group, string $courseCode): string {
        return "/api/term-planning/groups/{$group->id}/course-instructors?course={$courseCode}";
    }

    it('reports the most recent term a person taught the course', function () {
        taught(101, 'PI', 'ANTH-1001', 1265);
        taught(101, 'PI', 'ANTH-1001', PUBLISHED_TERM);
        actingAs($this->admin);

        $response = getJson(historyUrl($this->group, 'ANTH-1001'));

        $response->assertOk()->assertJson([
            ['emplid' => 101, 'role' => 'PI', 'lastTermId' => PUBLISHED_TERM, 'isPlanned' => false],
        ]);
    });

    // the picker fills two fields, and the TAs on a large lecture would bury
    // the instructors of record if the two shared one list
    it('keeps a person once per role they held', function () {
        taught(101, 'PI', 'ANTH-1001', 1265);
        taught(101, 'TA', 'ANTH-1001', 1261);
        actingAs($this->admin);

        $response = getJson(historyUrl($this->group, 'ANTH-1001'));

        expect($response->json())->toHaveCount(2);
        expect(collect($response->json())->pluck('role')->sort()->values()->all())
            ->toBe(['PI', 'TA']);
    });

    it('counts a term this department planned, marked as planned', function () {
        $section = plannedSection(['course_code' => 'ANTH-1001']);
        $section->instructors()->create(['emplid' => 202, 'role' => 'PI']);
        actingAs($this->admin);

        $response = getJson(historyUrl($this->group, 'ANTH-1001'));

        $response->assertOk()->assertJson([
            ['emplid' => 202, 'role' => 'PI', 'lastTermId' => PLANNABLE_TERM, 'isPlanned' => true],
        ]);
    });

    it('leaves out a deleted planned section', function () {
        $section = plannedSection(['course_code' => 'ANTH-1001']);
        $section->instructors()->create(['emplid' => 202, 'role' => 'PI']);
        $section->delete();
        actingAs($this->admin);

        getJson(historyUrl($this->group, 'ANTH-1001'))->assertOk()->assertJson([]);
    });

    it('leaves out another course', function () {
        taught(101, 'PI', 'ANTH-3001', PUBLISHED_TERM);
        actingAs($this->admin);

        getJson(historyUrl($this->group, 'ANTH-1001'))->assertOk()->assertJson([]);
    });

    it('requires the user to have read privileges', function () {
        actingAs($this->basicUser);

        getJson(historyUrl($this->group, 'ANTH-1001'))->assertForbidden();
    });
});
