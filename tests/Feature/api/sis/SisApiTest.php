<?php

use App\Group;
use App\Leave;
use App\SisAppointment;
use App\SisClassInstructor;
use App\SisClassMeeting;
use App\SisClassSection;
use App\SisCourse;
use App\SisDepartment;
use App\SisEmployee;
use App\SisTerm;
use App\User;
use Database\Seeders\TestDatabaseSeeder;

use function Pest\Laravel\{actingAs, getJson};

const TERM = 1269;
const OTHER_TERM = 1265;

beforeEach(function () {
    $this->seed(TestDatabaseSeeder::class);

    $this->department = SisDepartment::factory()->create(['dept_id' => '11111']);
    $this->group = Group::factory()->create(['dept_id' => $this->department->dept_id]);

    $this->admin = User::where('umndid', 'admin')->first();
    $this->basicUser = User::where('umndid', 'basic_user')->first();
});

/** A section in this test group's department, with the given overrides. */
function sectionInGroupDept(array $attributes = []): SisClassSection {
    return SisClassSection::factory()->create([
        'academic_org' => 11111,
        'term_code' => TERM,
        ...$attributes,
    ]);
}

/** A course in this test group's department, with the given overrides. */
function courseInGroupDept(array $attributes = []): SisCourse {
    return SisCourse::factory()->create([
        'academic_org' => 11111,
        ...$attributes,
    ]);
}

describe('GET /api/sis/terms', function () {
    it('returns one row per term, with undergraduate dates', function () {
        SisTerm::factory()->create([
            'term_code' => TERM,
            'academic_career' => 'UGRD',
            'description' => 'Fall 2026',
            'begins_on' => '2026-09-08',
            'ends_on' => '2026-12-23',
        ]);
        // the same term for another career, with its own end date
        SisTerm::factory()->create([
            'term_code' => TERM,
            'academic_career' => 'MED',
            'description' => 'Fall 2026',
            'begins_on' => '2026-09-08',
            'ends_on' => '2026-12-18',
        ]);

        actingAs($this->admin);
        $res = getJson('/api/sis/terms');

        expect($res->status())->toBe(200);
        expect($res->json())->toEqual([[
            'id' => TERM,
            'name' => 'Fall 2026',
            'startDate' => '2026-09-08',
            'endDate' => '2026-12-23',
        ]]);
    });

    it('returns the most recent term first', function () {
        SisTerm::factory()->create(['term_code' => OTHER_TERM, 'description' => 'Fall 2025']);
        SisTerm::factory()->create(['term_code' => TERM, 'description' => 'Fall 2026']);

        actingAs($this->admin);
        $res = getJson('/api/sis/terms');

        expect(collect($res->json())->pluck('id')->all())->toEqual([TERM, OTHER_TERM]);
    });
});

describe('GET /api/sis/groups', function () {
    it('returns the departments a scheduler can open, by name', function () {
        actingAs($this->admin);
        $res = getJson('/api/sis/groups');

        expect($res->status())->toBe(200);
        expect($res->json())->toContain([
            'id' => $this->group->id,
            'name' => $this->group->group_title,
            'abbreviation' => $this->group->abbreviation,
        ]);
    });

    it('leaves out a group that names no SIS department', function () {
        $group = Group::factory()->create(['dept_id' => 'not a department']);

        actingAs($this->admin);
        $res = getJson('/api/sis/groups');

        expect(collect($res->json())->pluck('id'))->not->toContain($group->id);
    });

    it('returns nothing to a user with no read privileges', function () {
        actingAs($this->basicUser);
        $res = getJson('/api/sis/groups');

        expect($res->status())->toBe(200);
        expect($res->json())->toBe([]);
    });
});

describe('GET /api/sis/groups/:groupId/sections', function () {
    it('returns the department sections for the requested term', function () {
        $section = sectionInGroupDept(['subject' => 'AFRO', 'catalog_number' => '4406']);
        sectionInGroupDept(['term_code' => OTHER_TERM]);
        SisClassSection::factory()->create(['academic_org' => 22222, 'term_code' => TERM]);

        actingAs($this->admin);
        $res = getJson("/api/sis/groups/{$this->group->id}/sections?term=" . TERM);

        expect($res->status())->toBe(200);
        expect($res->json())->toHaveCount(1);
        expect($res->json()[0])->toMatchArray([
            'id' => $section->id,
            'classNumber' => $section->class_number,
            'termId' => TERM,
            'courseCode' => 'AFRO-4406',
            'subject' => 'AFRO',
            'catalogNumber' => '4406',
            'section' => '001',
            'component' => 'LEC',
            'credits' => 3,
            'enrollmentCap' => 30,
            'enrollmentTotal' => 25,
            'crosslist' => null,
        ]);
    });

    it('excludes cancelled sections', function () {
        sectionInGroupDept();
        sectionInGroupDept(['is_cancelled' => true]);

        actingAs($this->admin);
        $res = getJson("/api/sis/groups/{$this->group->id}/sections?term=" . TERM);

        expect($res->json())->toHaveCount(1);
    });

    it('gives each meeting its days and clock times', function () {
        $section = sectionInGroupDept();
        SisClassMeeting::factory()->create([
            'sis_class_section_id' => $section->id,
            'starts_at' => '10:10:00',
            'ends_at' => '11:25:00',
            'meets_monday' => true,
            'meets_wednesday' => true,
            'meets_friday' => true,
        ]);

        actingAs($this->admin);
        $res = getJson("/api/sis/groups/{$this->group->id}/sections?term=" . TERM);

        expect($res->json()[0]['meetings'])->toEqual([[
            'days' => ['mon', 'wed', 'fri'],
            'startTime' => '10:10',
            'endTime' => '11:25',
        ]]);
    });

    it('leaves out meetings with no scheduled time', function () {
        $section = sectionInGroupDept();
        SisClassMeeting::factory()->withoutTimes()->create([
            'sis_class_section_id' => $section->id,
        ]);

        actingAs($this->admin);
        $res = getJson("/api/sis/groups/{$this->group->id}/sections?term=" . TERM);

        expect($res->json()[0]['meetings'])->toBe([]);
    });

    it('names each instructor', function () {
        $section = sectionInGroupDept();
        $employee = SisEmployee::factory()->create([
            'full_name' => 'Ana García',
            'last_name' => 'García',
            'internet_id' => 'garci123',
        ]);
        SisClassInstructor::factory()->create([
            'sis_class_section_id' => $section->id,
            'emplid' => $employee->emplid,
            'role' => 'PI',
        ]);

        actingAs($this->admin);
        $res = getJson("/api/sis/groups/{$this->group->id}/sections?term=" . TERM);

        expect($res->json()[0]['instructors'])->toEqual([[
            'emplid' => $employee->emplid,
            'role' => 'PI',
            'name' => 'Ana García',
            'lastName' => 'García',
            'internetId' => 'garci123',
        ]]);
    });

    it('parses the crosslist and elects one section to own the block', function () {
        $crosslist = 'AFRO 4406-001/GWSS 4406-001';
        sectionInGroupDept(['subject' => 'AFRO', 'catalog_number' => '4406', 'crosslist' => $crosslist]);
        sectionInGroupDept(['subject' => 'GWSS', 'catalog_number' => '4406', 'crosslist' => $crosslist]);

        actingAs($this->admin);
        $res = getJson("/api/sis/groups/{$this->group->id}/sections?term=" . TERM);

        $sections = collect($res->json())->keyBy('subject');

        expect($sections['AFRO']['crosslist'])->toEqual([
            'raw' => $crosslist,
            'partners' => [['subject' => 'GWSS', 'catalogNumber' => '4406', 'section' => '001']],
            'isPrimary' => true,
        ]);
        expect($sections['GWSS']['crosslist']['isPrimary'])->toBeFalse();
        expect($sections['GWSS']['crosslist']['partners'])
            ->toEqual([['subject' => 'AFRO', 'catalogNumber' => '4406', 'section' => '001']]);
    });

    it('requires a term', function () {
        actingAs($this->admin);
        $res = getJson("/api/sis/groups/{$this->group->id}/sections");

        expect($res->status())->toBe(422);
    });

    it('requires the user to have read privileges', function () {
        actingAs($this->basicUser);
        $res = getJson("/api/sis/groups/{$this->group->id}/sections?term=" . TERM);

        expect($res->status())->toBe(403);
    });

    it('returns nothing for a group with no SIS department', function () {
        $group = Group::factory()->create(['dept_id' => 'not a department']);
        sectionInGroupDept();

        actingAs($this->admin);
        $res = getJson("/api/sis/groups/{$group->id}/sections?term=" . TERM);

        expect($res->status())->toBe(200);
        expect($res->json())->toBe([]);
    });
});

describe('GET /api/sis/groups/:groupId/courses', function () {
    it('describes a course by the offering the import chose for it', function () {
        courseInGroupDept([
            'subject' => 'AFRO',
            'catalog_number' => '4406',
            'title' => 'African Cinema and Media',
            'credits' => 4,
            'last_offered_term_code' => TERM,
        ]);

        actingAs($this->admin);
        $res = getJson("/api/sis/groups/{$this->group->id}/courses");

        expect($res->status())->toBe(200);
        expect($res->json())->toEqual([[
            'id' => 'AFRO-4406',
            'courseCode' => 'AFRO-4406',
            'subject' => 'AFRO',
            'catalogNumber' => '4406',
            'title' => 'African Cinema and Media',
            'credits' => 4,
            'lastOfferedTermId' => TERM,
        ]]);
    });

    it('orders by subject and catalog number', function () {
        courseInGroupDept(['subject' => 'AFRO', 'catalog_number' => '4406']);
        courseInGroupDept(['subject' => 'AFRO', 'catalog_number' => '1021']);

        actingAs($this->admin);
        $res = getJson("/api/sis/groups/{$this->group->id}/courses");

        expect(collect($res->json())->pluck('courseCode')->all())
            ->toEqual(['AFRO-1021', 'AFRO-4406']);
    });

    it('leaves out courses belonging to another department', function () {
        courseInGroupDept(['subject' => 'AFRO', 'catalog_number' => '4406']);
        SisCourse::factory()->create(['academic_org' => 22222, 'subject' => 'HIST']);

        actingAs($this->admin);
        $res = getJson("/api/sis/groups/{$this->group->id}/courses");

        expect(collect($res->json())->pluck('courseCode')->all())->toEqual(['AFRO-4406']);
    });

    it('requires the user to have read privileges', function () {
        actingAs($this->basicUser);
        $res = getJson("/api/sis/groups/{$this->group->id}/courses");

        expect($res->status())->toBe(403);
    });
});

describe('GET /api/sis/groups/:groupId/employees', function () {
    it('returns the people appointed to the department', function () {
        $employee = SisEmployee::factory()->create([
            'full_name' => 'Ana García',
            'first_name' => 'Ana',
            'last_name' => 'García',
            'internet_id' => 'garci123',
        ]);
        SisAppointment::factory()->create([
            'emplid' => $employee->emplid,
            'dept_id' => $this->department->dept_id,
            'position_desc' => 'Associate Professor',
            'category' => 'Faculty',
        ]);
        SisAppointment::factory()->create();

        actingAs($this->admin);
        $res = getJson("/api/sis/groups/{$this->group->id}/employees");

        expect($res->status())->toBe(200);
        expect($res->json())->toEqual([[
            'emplid' => $employee->emplid,
            'name' => 'Ana García',
            'firstName' => 'Ana',
            'lastName' => 'García',
            'internetId' => 'garci123',
            'positionTitle' => 'Associate Professor',
            'category' => 'Faculty',
        ]]);
    });

    it('lists someone with several jobs once, by their primary appointment', function () {
        $employee = SisEmployee::factory()->create();
        SisAppointment::factory()->create([
            'emplid' => $employee->emplid,
            'dept_id' => $this->department->dept_id,
            'job_code' => '9401',
            'job_indicator' => 'S',
            'position_desc' => 'Department Chair',
        ]);
        SisAppointment::factory()->create([
            'emplid' => $employee->emplid,
            'dept_id' => $this->department->dept_id,
            'job_code' => '9403',
            'job_indicator' => 'P',
            'position_desc' => 'Professor',
        ]);

        actingAs($this->admin);
        $res = getJson("/api/sis/groups/{$this->group->id}/employees");

        expect($res->json())->toHaveCount(1);
        expect($res->json()[0]['positionTitle'])->toBe('Professor');
    });

    it('requires the user to have read privileges', function () {
        actingAs($this->basicUser);
        $res = getJson("/api/sis/groups/{$this->group->id}/employees");

        expect($res->status())->toBe(403);
    });
});

/**
 * A BlueSheet user with a SIS employee and appointment row.
 * Appointed to this test group's department unless another is named.
 */
function appointedUser(array $attributes = [], string $deptId = '11111'): User {
    $employee = SisEmployee::factory()->create();
    SisAppointment::factory()->create([
        'emplid' => $employee->emplid,
        'dept_id' => $deptId,
    ]);

    return User::factory()->create([
        'emplid' => $employee->emplid,
        ...$attributes,
    ]);
}

/**
 * A sabbatical for this person. Status is confirmed rather than the
 * factory's random pick, which can be cancelled and so filtered out.
 */
function leaveFor(User $user, string $startDate, string $endDate, array $attributes = []): Leave {
    return Leave::factory()->create([
        'user_id' => $user->id,
        'status' => Leave::STATUS_CONFIRMED,
        'type' => Leave::TYPE_SABBATICAL,
        'start_date' => $startDate,
        'end_date' => $endDate,
        ...$attributes,
    ]);
}

describe('GET /api/sis/groups/:groupId/leaves', function () {
    beforeEach(function () {
        SisTerm::factory()->create([
            'term_code' => TERM,
            'begins_on' => '2026-09-08',
            'ends_on' => '2026-12-23',
        ]);

        $this->url = "/api/sis/groups/{$this->group->id}/leaves?term=" . TERM;
    });

    it('describes a leave overlapping the term', function () {
        $user = appointedUser([
            'givenname' => 'Ana',
            'surname' => 'García',
            'displayname' => 'Ana García',
        ]);
        $leave = leaveFor($user, '2026-09-01', '2026-12-31');

        actingAs($this->admin);
        $res = getJson($this->url);

        expect($res->status())->toBe(200);
        expect($res->json())->toEqual([[
            'id' => $leave->id,
            'userId' => $user->id,
            'emplid' => $user->emplid,
            'name' => 'Ana García',
            'lastName' => 'García',
            'type' => 'sabbatical',
            'status' => 'confirmed',
            'startDate' => '2026-09-01',
            'endDate' => '2026-12-31',
        ]]);
    });

    it('finds a leave that begins and ends inside the term', function () {
        leaveFor(appointedUser(), '2026-10-01', '2026-11-01');

        actingAs($this->admin);

        expect(getJson($this->url)->json())->toHaveCount(1);
    });

    it('leaves out a leave that ends before the term begins', function () {
        leaveFor(appointedUser(), '2026-05-01', '2026-08-31');

        actingAs($this->admin);

        expect(getJson($this->url)->json())->toBe([]);
    });

    it('leaves out a leave that begins after the term ends', function () {
        leaveFor(appointedUser(), '2027-01-15', '2027-05-15');

        actingAs($this->admin);

        expect(getJson($this->url)->json())->toBe([]);
    });

    it('finds a leave ending on the term\'s first day', function () {
        leaveFor(appointedUser(), '2026-05-01', '2026-09-08');

        actingAs($this->admin);

        expect(getJson($this->url)->json())->toHaveCount(1);
    });

    it('finds a leave beginning on the term\'s last day', function () {
        leaveFor(appointedUser(), '2026-12-23', '2027-05-15');

        actingAs($this->admin);

        expect(getJson($this->url)->json())->toHaveCount(1);
    });

    it('finds a leave for someone teaching nothing that term', function () {
        $onLeave = appointedUser();
        leaveFor($onLeave, '2026-09-01', '2026-12-31');

        SisClassInstructor::factory()->create([
            'sis_class_section_id' => sectionInGroupDept()->id,
            'emplid' => appointedUser()->emplid,
        ]);

        actingAs($this->admin);
        $res = getJson($this->url);

        expect($res->json())->toHaveCount(1);
        expect($res->json()[0]['userId'])->toBe($onLeave->id);
    });

    it('leaves out a cancelled leave', function () {
        leaveFor(appointedUser(), '2026-09-01', '2026-12-31', [
            'status' => Leave::STATUS_CANCELLED,
        ]);

        actingAs($this->admin);

        expect(getJson($this->url)->json())->toBe([]);
    });

    it('leaves out a deleted leave', function () {
        leaveFor(appointedUser(), '2026-09-01', '2026-12-31')->delete();

        actingAs($this->admin);

        expect(getJson($this->url)->json())->toBe([]);
    });

    it('leaves out a leave belonging to another department', function () {
        $otherDepartment = SisDepartment::factory()->create(['dept_id' => '22222']);
        $otherDeptUser = appointedUser([], $otherDepartment->dept_id);
        leaveFor($otherDeptUser, '2026-09-01', '2026-12-31');

        actingAs($this->admin);

        expect(getJson($this->url)->json())->toBe([]);
    });

    it('leaves out a leave whose owner holds no appointment', function () {
        leaveFor(User::factory()->create(), '2026-09-01', '2026-12-31');

        actingAs($this->admin);

        expect(getJson($this->url)->json())->toBe([]);
    });

    it('gives a person with two leaves in the term a row each', function () {
        $user = appointedUser();
        leaveFor($user, '2026-09-01', '2026-12-31', ['type' => Leave::TYPE_SABBATICAL]);
        leaveFor($user, '2026-10-01', '2026-10-31', ['type' => Leave::TYPE_COURSE_RELEASE]);

        actingAs($this->admin);
        $res = getJson($this->url);

        expect($res->json())->toHaveCount(2);
        expect(collect($res->json())->pluck('type')->all())
            ->toEqualCanonicalizing(['sabbatical', 'course_release']);
    });

    it('requires a term', function () {
        actingAs($this->admin);
        $res = getJson("/api/sis/groups/{$this->group->id}/leaves");

        expect($res->status())->toBe(422);
    });

    it('requires the user to have leave read privileges', function () {
        actingAs($this->basicUser);

        expect(getJson($this->url)->status())->toBe(403);
    });

    it('returns nothing for a group with no SIS department', function () {
        $group = Group::factory()->create(['dept_id' => 'not a department']);
        leaveFor(appointedUser(), '2026-09-01', '2026-12-31');

        actingAs($this->admin);
        $res = getJson("/api/sis/groups/{$group->id}/leaves?term=" . TERM);

        expect($res->status())->toBe(200);
        expect($res->json())->toBe([]);
    });

    it('returns nothing for a term the SIS has no dates for', function () {
        leaveFor(appointedUser(), '2026-09-01', '2026-12-31');

        actingAs($this->admin);
        $res = getJson("/api/sis/groups/{$this->group->id}/leaves?term=" . OTHER_TERM);

        expect($res->status())->toBe(200);
        expect($res->json())->toBe([]);
    });
});
