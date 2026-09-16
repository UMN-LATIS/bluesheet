<?php

use App\Constants\Permissions;
use App\Group;
use App\Leave;
use App\LocalClassInstructor;
use App\LocalClassSection;
use App\Membership;
use App\SisAppointment;
use App\SisClassInstructor;
use App\SisClassSection;
use App\SisDepartment;
use App\SisEmployee;
use App\SisTerm;
use App\User;
use Carbon\Carbon;
use Database\Seeders\TestDatabaseSeeder;

use function Pest\Laravel\{actingAs, getJson};

beforeEach(function () {
    $this->seed(TestDatabaseSeeder::class);

    $this->department = SisDepartment::factory()->create(['dept_id' => '11111']);
    $this->group = Group::factory()->create(['dept_id' => $this->department->dept_id]);

    $this->admin = User::where('umndid', 'admin')->first();
    $this->basicUser = User::where('umndid', 'basic_user')->first();

    Carbon::setTestNow('2026-10-01');

    foreach ([
        [1263, 'Spring 2026', '2026-01-20', '2026-05-13'],
        [1265, 'Summer 2026', '2026-05-18', '2026-08-14'],
        [1269, 'Fall 2026', '2026-09-08', '2026-12-23'],
        [1273, 'Spring 2027', '2027-01-19', '2027-05-12'],
        [1275, 'Summer 2027', '2027-05-17', '2027-08-13'],
    ] as [$termCode, $description, $beginsOn, $endsOn]) {
        SisTerm::factory()->create([
            'term_code' => $termCode,
            'description' => $description,
            'begins_on' => $beginsOn,
            'ends_on' => $endsOn,
        ]);
    }
});

afterEach(function () {
    Carbon::setTestNow();
});

function departmentMember(array $userAttributes = [], array $appointmentAttributes = [], string $deptId = '11111'): User {
    $employee = SisEmployee::factory()->create();

    SisAppointment::factory()->create([
        'emplid' => $employee->emplid,
        'dept_id' => $deptId,
        ...$appointmentAttributes,
    ]);

    return User::factory()->create([
        'emplid' => $employee->emplid,
        ...$userAttributes,
    ]);
}

function leaveTaken(User $user, string $startDate, string $endDate, array $attributes = []): Leave {
    return Leave::factory()->create([
        'user_id' => $user->id,
        'status' => Leave::STATUS_CONFIRMED,
        'type' => Leave::TYPE_SABBATICAL,
        'start_date' => $startDate,
        'end_date' => $endDate,
        ...$attributes,
    ]);
}

function taughtSection(int $emplid, array $sectionAttributes = [], string $role = 'PI'): SisClassSection {
    $section = SisClassSection::factory()->create([
        'academic_org' => 11111,
        'subject' => 'ANTH',
        'catalog_number' => '1001',
        ...$sectionAttributes,
    ]);

    SisClassInstructor::factory()->create([
        'sis_class_section_id' => $section->id,
        'emplid' => $emplid,
        'role' => $role,
    ]);

    return $section;
}

function plannedSectionFor(int $emplid, array $sectionAttributes = [], string $role = 'PI'): LocalClassSection {
    $section = LocalClassSection::factory()->create([
        'academic_org' => 11111,
        'subject' => 'ANTH',
        'catalog_number' => '1001',
        ...$sectionAttributes,
    ]);

    LocalClassInstructor::factory()->create([
        'local_class_section_id' => $section->id,
        'emplid' => $emplid,
        'role' => $role,
    ]);

    return $section;
}

describe('GET /api/leave-planning/groups', function () {
    it('lists a department group to a user who may view any leaves', function () {
        actingAs($this->admin);
        $res = getJson('/api/leave-planning/groups');

        expect($res->status())->toBe(200);
        expect(collect($res->json())->pluck('id'))->toContain($this->group->id);
    });

    it('lists only the groups a user manages to a user without global leave access', function () {
        $otherGroup = Group::factory()->create(['dept_id' => '22222']);
        Membership::factory()->create([
            'group_id' => $this->group->id,
            'user_id' => $this->basicUser->id,
            'admin' => true,
        ]);

        actingAs($this->basicUser);
        $ids = collect(getJson('/api/leave-planning/groups')->json())->pluck('id');

        expect($ids)->toContain($this->group->id);
        expect($ids)->not->toContain($otherGroup->id);
    });

    it('leaves out a group the user can only view courses for', function () {
        $user = User::factory()->create()->givePermissionTo(Permissions::VIEW_PLANNED_COURSES);

        actingAs($user);

        expect(getJson('/api/leave-planning/groups')->json())->toBe([]);
    });

    it('leaves out a group that names no SIS department', function () {
        $group = Group::factory()->create(['dept_id' => 'not a department']);

        actingAs($this->admin);
        $ids = collect(getJson('/api/leave-planning/groups')->json())->pluck('id');

        expect($ids)->not->toContain($group->id);
    });
});

describe('GET /api/leave-planning/groups/:groupId/leaves', function () {
    beforeEach(function () {
        $this->url = "/api/leave-planning/groups/{$this->group->id}/leaves";
    });

    it('describes each leave in range and the person taking it', function () {
        $user = departmentMember(
            ['ssl_eligible' => true],
            ['position_desc' => 'Professor', 'category' => 'Faculty', 'job_code' => '9401'],
        );
        $employee = SisEmployee::where('emplid', $user->emplid)->first();
        $leave = leaveTaken($user, '2026-09-01', '2026-12-31', ['description' => 'Fieldwork']);

        actingAs($this->admin);
        $res = getJson("{$this->url}?start=1269&end=1269");

        expect($res->status())->toBe(200);
        expect($res->json())->toEqual([
            'range' => ['startTermId' => 1269, 'endTermId' => 1269],
            'people' => [[
                'emplid' => $user->emplid,
                'userId' => $user->id,
                'name' => $employee->full_name,
                'firstName' => $employee->first_name,
                'lastName' => $employee->last_name,
                'title' => 'Professor',
                'categories' => ['Faculty'],
                'jobCodes' => ['9401'],
                'hasAppointment' => true,
                'sslEligible' => true,
                'sslApplyEligible' => false,
                'midcareerEligible' => false,
            ]],
            'leaves' => [[
                'id' => $leave->id,
                'emplid' => $user->emplid,
                'userId' => $user->id,
                'type' => 'sabbatical',
                'status' => 'confirmed',
                'startDate' => '2026-09-01',
                'endDate' => '2026-12-31',
                'description' => 'Fieldwork',
            ]],
        ]);
    });

    it('opens on the terms from an in-progress leave to the latest upcoming one', function () {
        leaveTaken(departmentMember(), '2026-02-01', '2026-12-31');
        leaveTaken(departmentMember(), '2027-01-19', '2027-05-12');

        actingAs($this->admin);

        expect(getJson($this->url)->json('range'))->toBe(['startTermId' => 1263, 'endTermId' => 1273]);
    });

    it('does not widen the default range for a cancelled leave', function () {
        leaveTaken(departmentMember(), '2026-02-01', '2027-05-12', ['status' => Leave::STATUS_CANCELLED]);

        actingAs($this->admin);

        expect(getJson($this->url)->json('range'))->toBe(['startTermId' => 1269, 'endTermId' => 1269]);
    });

    it('moves the default start back to a requested end', function () {
        actingAs($this->admin);

        expect(getJson("{$this->url}?end=1265")->json('range'))
            ->toBe(['startTermId' => 1265, 'endTermId' => 1265]);
    });

    it('takes today as the date in Minnesota, not in UTC', function () {
        Carbon::setTestNow(Carbon::parse('2026-12-23 20:00', 'America/Chicago'));
        leaveTaken(departmentMember(), '2026-09-08', '2026-12-23');

        actingAs($this->admin);

        expect(getJson($this->url)->json('range'))->toBe(['startTermId' => 1269, 'endTermId' => 1269]);
    });

    it('moves the default end up to a requested start', function () {
        actingAs($this->admin);

        expect(getJson("{$this->url}?start=1275")->json('range'))
            ->toBe(['startTermId' => 1275, 'endTermId' => 1275]);
    });

    it('includes cancelled leaves in range', function () {
        leaveTaken(departmentMember(), '2026-09-08', '2026-12-23', ['status' => Leave::STATUS_CANCELLED]);

        actingAs($this->admin);

        expect(getJson("{$this->url}?start=1269&end=1269")->json('leaves.0.status'))->toBe('cancelled');
    });

    it('leaves out a deleted leave', function () {
        leaveTaken(departmentMember(), '2026-09-08', '2026-12-23')->delete();

        actingAs($this->admin);

        expect(getJson("{$this->url}?start=1269&end=1269")->json('leaves'))->toBe([]);
    });

    it('finds leaves touching either edge of the range, and not beyond it', function () {
        $member = departmentMember();
        leaveTaken($member, '2026-05-01', '2026-09-08');
        leaveTaken($member, '2027-05-12', '2027-06-01');
        leaveTaken($member, '2026-10-01', '2026-11-01');
        leaveTaken($member, '2026-01-01', '2026-09-07');
        leaveTaken($member, '2027-05-13', '2027-06-01');

        actingAs($this->admin);
        $res = getJson("{$this->url}?start=1269&end=1273");

        expect(collect($res->json('leaves'))->pluck('startDate')->all())
            ->toBe(['2026-05-01', '2026-10-01', '2027-05-12']);
    });

    it('leaves out a person with no appointment in the department', function () {
        SisDepartment::factory()->create(['dept_id' => '22222']);
        leaveTaken(departmentMember([], [], '22222'), '2026-09-08', '2026-12-23');

        actingAs($this->admin);
        $res = getJson("{$this->url}?start=1269&end=1269");

        expect($res->json('leaves'))->toBe([]);
        expect($res->json('people'))->toBe([]);
    });

    it('rejects a term the SIS has no dates for', function () {
        actingAs($this->admin);

        expect(getJson("{$this->url}?start=1111")->status())->toBe(422);
    });

    it('rejects an end before the start', function () {
        actingAs($this->admin);

        expect(getJson("{$this->url}?start=1273&end=1269")->status())->toBe(422);
    });

    it('answers a group manager', function () {
        Membership::factory()->create([
            'group_id' => $this->group->id,
            'user_id' => $this->basicUser->id,
            'admin' => true,
        ]);

        actingAs($this->basicUser);

        expect(getJson($this->url)->status())->toBe(200);
    });

    it('requires the user to have leave read privileges', function () {
        actingAs($this->basicUser);

        expect(getJson($this->url)->status())->toBe(403);
    });

    it('returns nothing for a group with no SIS department', function () {
        $group = Group::factory()->create(['dept_id' => 'not a department']);

        actingAs($this->admin);

        expect(getJson("/api/leave-planning/groups/{$group->id}/leaves")->json())
            ->toBe(['range' => null, 'people' => [], 'leaves' => []]);
    });
});

describe('GET /api/leave-planning/groups/:groupId/teaching-history', function () {
    beforeEach(function () {
        $this->url = "/api/leave-planning/groups/{$this->group->id}/teaching-history";
    });

    it('describes a published section', function () {
        $member = departmentMember();
        taughtSection($member->emplid, [
            'term_code' => 1269,
            'class_section' => '003',
            'title' => 'Human Evolution',
            'component' => 'LEC',
            'academic_career' => 'UGRD',
            'enrollment_cap' => 120,
            'enrollment_total' => 98,
            'crosslist' => null,
        ]);

        actingAs($this->admin);
        $res = getJson("{$this->url}?start=1269&end=1269");

        expect($res->status())->toBe(200);
        expect($res->json('sections'))->toEqual([[
            'key' => 'ANTH-1001-003-FA26',
            'termId' => 1269,
            'courseCode' => 'ANTH-1001',
            'subject' => 'ANTH',
            'catalogNumber' => '1001',
            'section' => '003',
            'title' => 'Human Evolution',
            'component' => 'LEC',
            'enrollmentCap' => 120,
            'instructors' => [['emplid' => $member->emplid, 'role' => 'PI']],
            'career' => 'UGRD',
            'enrollmentTotal' => 98,
            'isPlanned' => false,
            'crosslist' => null,
        ]]);
    });

    it('reads planned sections for a term the SIS has not published', function () {
        $member = departmentMember();
        plannedSectionFor($member->emplid, ['term_code' => 1275, 'class_section' => '003']);

        actingAs($this->admin);
        $section = getJson("{$this->url}?start=1275&end=1275")->json('sections.0');

        expect($section['isPlanned'])->toBeTrue();
        expect($section['key'])->toBe('ANTH-1001-003-SU27');
        expect($section['enrollmentTotal'])->toBeNull();
        expect($section['career'])->toBeNull();
    });

    it('ignores a plan for a term once the SIS has published it', function () {
        $member = departmentMember();
        plannedSectionFor($member->emplid, ['term_code' => 1269, 'class_section' => '003']);
        plannedSectionFor($member->emplid, ['term_code' => 1269, 'class_section' => '009']);
        taughtSection($member->emplid, ['term_code' => 1269, 'class_section' => '003']);

        actingAs($this->admin);
        $sections = getJson("{$this->url}?start=1269&end=1269")->json('sections');

        expect(collect($sections)->pluck('key')->all())->toBe(['ANTH-1001-003-FA26']);
        expect($sections[0]['isPlanned'])->toBeFalse();
    });

    it('gives a planned section the key its published section will have', function () {
        $member = departmentMember();
        plannedSectionFor($member->emplid, ['term_code' => 1275, 'class_section' => '003']);

        actingAs($this->admin);
        $plannedKey = getJson("{$this->url}?start=1275&end=1275")->json('sections.0.key');

        taughtSection($member->emplid, ['term_code' => 1275, 'class_section' => '003']);
        $publishedKey = getJson("{$this->url}?start=1275&end=1275")->json('sections.0.key');

        expect($publishedKey)->toBe($plannedKey);
    });

    it('leaves out cancelled and independent study sections from both sources', function () {
        $member = departmentMember();
        taughtSection($member->emplid, ['term_code' => 1269, 'class_section' => '001', 'is_cancelled' => true]);
        taughtSection($member->emplid, ['term_code' => 1269, 'class_section' => '002', 'component' => 'IND']);
        plannedSectionFor($member->emplid, ['term_code' => 1275, 'class_section' => '001', 'is_cancelled' => true]);
        plannedSectionFor($member->emplid, ['term_code' => 1275, 'class_section' => '002', 'component' => 'IND']);

        actingAs($this->admin);

        expect(getJson("{$this->url}?start=1269&end=1275")->json('sections'))->toBe([]);
    });

    it('treats a term with only a cancelled SIS section as published', function () {
        $member = departmentMember();
        taughtSection($member->emplid, ['term_code' => 1275, 'class_section' => '001', 'is_cancelled' => true]);
        plannedSectionFor($member->emplid, ['term_code' => 1275, 'class_section' => '002']);

        actingAs($this->admin);

        expect(getJson("{$this->url}?start=1275&end=1275")->json('sections'))->toBe([]);
    });

    it('leaves out a planned section in a term the SIS does not know', function () {
        plannedSectionFor(departmentMember()->emplid, ['term_code' => 1267]);

        actingAs($this->admin);

        expect(getJson("{$this->url}?start=1263&end=1273")->status())->toBe(200);
        expect(getJson("{$this->url}?start=1263&end=1273")->json('sections'))->toBe([]);
    });

    it('reports eligibility flags for each person', function () {
        departmentMember(['midcareer_eligible' => true, 'ssl_apply_eligible' => true]);

        actingAs($this->admin);
        $person = getJson("{$this->url}?start=1269&end=1269")->json('people.0');

        expect($person['midcareerEligible'])->toBeTrue();
        expect($person['sslApplyEligible'])->toBeTrue();
        expect($person['sslEligible'])->toBeFalse();
    });

    it('keeps each role an instructor holds', function () {
        $member = departmentMember();
        $section = taughtSection($member->emplid, ['term_code' => 1269]);
        $ta = SisEmployee::factory()->create();
        $si = SisEmployee::factory()->create();
        SisClassInstructor::factory()->create(['sis_class_section_id' => $section->id, 'emplid' => $ta->emplid, 'role' => 'TA']);
        SisClassInstructor::factory()->create(['sis_class_section_id' => $section->id, 'emplid' => $si->emplid, 'role' => 'SI']);

        actingAs($this->admin);
        $instructors = getJson("{$this->url}?start=1269&end=1269")->json('sections.0.instructors');

        expect(collect($instructors)->pluck('role')->all())->toBe(['PI', 'SI', 'TA']);
    });

    it('lists everyone appointed to the department and everyone who taught in range', function () {
        $appointedOnly = departmentMember();
        $pastTeachingAssistant = SisEmployee::factory()->create();
        taughtSection($pastTeachingAssistant->emplid, ['term_code' => 1269], 'TA');
        $outsideRange = SisEmployee::factory()->create();
        taughtSection($outsideRange->emplid, ['term_code' => 1263, 'class_section' => '002']);

        actingAs($this->admin);
        $people = collect(getJson("{$this->url}?start=1269&end=1269")->json('people'));

        expect($people->pluck('emplid')->all())->toEqualCanonicalizing([
            $appointedOnly->emplid,
            $pastTeachingAssistant->emplid,
        ]);
        expect($people->firstWhere('emplid', $pastTeachingAssistant->emplid)['hasAppointment'])->toBeFalse();
    });

    it('requires a start and an end no earlier than it', function () {
        actingAs($this->admin);

        expect(getJson($this->url)->status())->toBe(422);
        expect(getJson("{$this->url}?start=1273&end=1269")->status())->toBe(422);
    });

    it('requires the user to have course read privileges', function () {
        actingAs($this->basicUser);

        expect(getJson("{$this->url}?start=1269&end=1269")->status())->toBe(403);
    });
});
