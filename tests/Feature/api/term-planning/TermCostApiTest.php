<?php

use App\Constants\Permissions;
use App\Group;
use App\JobCode;
use App\JobCodeTermRate;
use App\Library\TermPlan\InstructorType;
use App\Membership;
use App\SisAppointment;
use App\SisClassInstructor;
use App\SisClassMeeting;
use App\SisClassSection;
use App\SisDepartment;
use App\SisEmployee;
use App\TermJobCodeRateOverride;
use App\TermPersonNote;
use App\TermPersonRateOverride;
use App\User;
use Database\Seeders\TestDatabaseSeeder;

use function Pest\Laravel\{actingAs, getJson, patchJson, putJson};

const TERM_FALL_2026 = 1269;
const COST_API_DEPT = 22222;
const COST_API_OTHER_DEPT = 33333;

beforeEach(function () {
    $this->seed(TestDatabaseSeeder::class);

    SisDepartment::factory()->create(['dept_id' => (string) COST_API_DEPT]);
    SisDepartment::factory()->create(['dept_id' => (string) COST_API_OTHER_DEPT]);
    $this->group = Group::factory()->create(['dept_id' => (string) COST_API_DEPT]);
    $this->basicUser = User::where('umndid', 'basic_user')->first();

    $this->groupManager = User::factory()->create();
    Membership::factory()->create([
        'user_id' => $this->groupManager->id,
        'group_id' => $this->group->id,
        'admin' => true,
    ]);
    $this->coursesViewer = User::factory()->create()->givePermissionTo(Permissions::VIEW_PLANNED_COURSES);
    $this->coursesEditor = User::factory()->create()->givePermissionTo(Permissions::EDIT_PLANNED_COURSES);
});

function costAssumptionsUrl(Group $group, ?int $term = TERM_FALL_2026): string {
    $query = $term === null ? '' : "?term={$term}";

    return "/api/term-planning/groups/{$group->id}/cost-assumptions{$query}";
}

function jobCodeRateOverrideUrl(Group $group, string $jobCode): string {
    return "/api/term-planning/groups/{$group->id}/cost-rate-overrides/job-codes/{$jobCode}?term=" . TERM_FALL_2026;
}

function personRateOverrideUrl(Group $group, string $emplid): string {
    return "/api/term-planning/groups/{$group->id}/cost-rate-overrides/people/{$emplid}?term=" . TERM_FALL_2026;
}

function personNoteUrl(Group $group, string $emplid): string {
    return "/api/term-planning/groups/{$group->id}/person-notes/{$emplid}?term=" . TERM_FALL_2026;
}

function enrollmentHistoryUrl(Group $group, int $term = TERM_FALL_2026): string {
    return "/api/term-planning/groups/{$group->id}/enrollment-history?term={$term}";
}

function appointedEmployee(string $jobCode, int $deptId = COST_API_DEPT): SisEmployee {
    $employee = SisEmployee::factory()->create();
    SisAppointment::factory()->create([
        'emplid' => $employee->emplid,
        'dept_id' => (string) $deptId,
        'job_code' => $jobCode,
    ]);

    return $employee;
}

function enrollmentHistorySection(int $termCode, array $attributes = []): SisClassSection {
    return SisClassSection::factory()->create([
        'academic_org' => COST_API_DEPT,
        'term_code' => $termCode,
        ...$attributes,
    ]);
}

describe('GET cost-assumptions authorization', function () {
    it('refuses a user with no course permissions', function () {
        actingAs($this->basicUser);

        expect(getJson(costAssumptionsUrl($this->group))->status())->toBe(403);
    });

    it('lets a courses viewer read but reports canEdit false', function () {
        actingAs($this->coursesViewer);
        $res = getJson(costAssumptionsUrl($this->group));

        expect($res->status())->toBe(200);
        expect($res->json('canEdit'))->toBeFalse();
    });

    it('reports canEdit true for a group manager', function () {
        actingAs($this->groupManager);
        $res = getJson(costAssumptionsUrl($this->group));

        expect($res->status())->toBe(200);
        expect($res->json('canEdit'))->toBeTrue();
    });

    it('returns 404 for a group with no department', function () {
        $group = Group::factory()->create(['dept_id' => null]);
        Membership::factory()->create([
            'user_id' => $this->groupManager->id,
            'group_id' => $group->id,
            'admin' => true,
        ]);
        actingAs($this->groupManager);

        expect(getJson(costAssumptionsUrl($group))->status())->toBe(404);
    });

    it('rejects a request with no term', function () {
        actingAs($this->groupManager);

        expect(getJson(costAssumptionsUrl($this->group, null))->status())->toBe(422);
    });

    it('rejects a term code whose last digit names no season', function () {
        actingAs($this->groupManager);

        expect(getJson(costAssumptionsUrl($this->group, 1271))->status())->toBe(422);
    });
});

describe('override authorization', function () {
    it('refuses a courses viewer on every override', function () {
        actingAs($this->coursesViewer);

        expect(patchJson(jobCodeRateOverrideUrl($this->group, 'TBA'), ['salary' => 1])->status())->toBe(403);
        expect(putJson(personRateOverrideUrl($this->group, '100000001'), ['salary' => 1])->status())->toBe(403);
        expect(putJson(personNoteUrl($this->group, '100000001'), ['notes' => 'x'])->status())->toBe(403);
    });

    it('lets a courses editor save every override', function () {
        actingAs($this->coursesEditor);

        expect(patchJson(jobCodeRateOverrideUrl($this->group, 'TBA'), ['salary' => 1])->status())->toBe(200);
        expect(putJson(personRateOverrideUrl($this->group, '100000001'), ['salary' => 1])->status())->toBe(200);
        expect(putJson(personNoteUrl($this->group, '100000001'), ['notes' => 'x'])->status())->toBe(200);
    });
});

describe('job code rates', function () {
    beforeEach(function () {
        actingAs($this->groupManager);
    });

    it('describes a job code with its type and annual load, and lists the migrated TBA row', function () {
        JobCode::factory()->create([
            'code' => '9519',
            'instructor_type' => InstructorType::TeachingAssistant,
            'annual_load' => 2,
        ]);

        $rows = collect(getJson(costAssumptionsUrl($this->group))->json('jobCodes'))->keyBy('code');

        expect($rows['9519'])->toMatchArray(['instructorType' => 'teaching_assistant', 'annualLoad' => 2]);
        expect($rows['TBA'])->toMatchArray(['instructorType' => null, 'annualLoad' => null]);
    });

    it('reports the salary, fringe rate, and source of the rate for exactly the requested term', function () {
        $jobCode = JobCode::factory()->create();
        JobCodeTermRate::factory()->create(['job_code_id' => $jobCode->id, 'term_code' => 1259, 'salary' => 9000]);
        JobCodeTermRate::factory()->create([
            'job_code_id' => $jobCode->id,
            'term_code' => TERM_FALL_2026,
            'salary' => 5870.2,
            'fringe_rate' => 1.1264,
            'source' => 'Sample data',
        ]);
        JobCodeTermRate::factory()->create(['job_code_id' => $jobCode->id, 'term_code' => 1273, 'salary' => 11000]);

        $row = getJson(costAssumptionsUrl($this->group))->json('jobCodes.0');

        expect($row['code'])->toBe($jobCode->code);
        expect($row['salary'])->toBe(5870.2);
        expect($row['fringeRate'])->toBe(1.1264);
        expect($row['source'])->toBe('Sample data');
    });

    it('reports a null salary and fringe rate for a term with no rate, without falling back to an earlier term', function () {
        $jobCode = JobCode::factory()->create();
        JobCodeTermRate::factory()->create(['job_code_id' => $jobCode->id, 'term_code' => 1259]);

        $row = getJson(costAssumptionsUrl($this->group))->json('jobCodes.0');

        expect($row['salary'])->toBeNull();
        expect($row['fringeRate'])->toBeNull();
        expect($row['source'])->toBeNull();
    });
});

describe('people', function () {
    beforeEach(function () {
        actingAs($this->groupManager);
    });

    it('lists each person of the department with distinct, trimmed, sorted job codes', function () {
        $employee = appointedEmployee('9402 ');
        SisAppointment::factory()->create(['emplid' => $employee->emplid, 'dept_id' => (string) COST_API_DEPT, 'job_code' => '9401', 'job_indicator' => 'P']);
        SisAppointment::factory()->create(['emplid' => $employee->emplid, 'dept_id' => (string) COST_API_DEPT, 'job_code' => '9402', 'job_indicator' => 'S']);

        $people = getJson(costAssumptionsUrl($this->group))->json('people');

        expect($people)->toHaveCount(1)
            ->and($people[0]['emplid'])->toBe($employee->emplid)
            ->and($people[0]['jobCodes'])->toBe(['9401', '9402']);
    });

    it('gives each job code the position title on the appointment, leaving out blank ones', function () {
        $employee = SisEmployee::factory()->create();
        $appoint = fn(string $jobCode, ?string $title, string $indicator) => SisAppointment::factory()->create([
            'emplid' => $employee->emplid,
            'dept_id' => (string) COST_API_DEPT,
            'job_code' => $jobCode,
            'position_desc' => $title,
            'job_indicator' => $indicator,
        ]);
        $appoint('9401 ', 'Professor ', 'P');
        $appoint('9702', null, 'S');

        $people = getJson(costAssumptionsUrl($this->group))->json('people');

        expect($people[0]['positionTitles'])->toBe(['9401' => 'Professor']);
    });

    it('leaves out a person appointed only in another department', function () {
        appointedEmployee('9401', COST_API_OTHER_DEPT);

        expect(getJson(costAssumptionsUrl($this->group))->json('people'))->toBe([]);
    });
});

describe('rate overrides', function () {
    beforeEach(function () {
        actingAs($this->groupManager);
    });

    it('lists a job code override for its own term only', function () {
        patchJson(jobCodeRateOverrideUrl($this->group, 'TBA'), ['salary' => 12000.5, 'fringeRate' => 0.4]);

        expect(getJson(costAssumptionsUrl($this->group))->json('rateOverrides.jobCodes'))
            ->toBe([['jobCode' => 'TBA', 'salary' => 12000.5, 'fringeRate' => 0.4]]);
        expect(getJson(costAssumptionsUrl($this->group, 1273))->json('rateOverrides.jobCodes'))->toBe([]);
    });

    it('overrides the salary alone and the fringe rate alone', function () {
        JobCode::factory()->create(['code' => '9753']);
        $salaryRes = patchJson(jobCodeRateOverrideUrl($this->group, 'TBA'), ['salary' => 100]);
        $fringeRes = patchJson(jobCodeRateOverrideUrl($this->group, '9753'), ['fringeRate' => 0.5]);

        expect($salaryRes->json())->toEqual(['jobCode' => 'TBA', 'salary' => 100.0, 'fringeRate' => null]);
        expect($fringeRes->json())->toEqual(['jobCode' => '9753', 'salary' => null, 'fringeRate' => 0.5]);
    });

    it('leaves a field alone when its key is absent and clears it when null', function () {
        patchJson(jobCodeRateOverrideUrl($this->group, 'TBA'), ['salary' => 100, 'fringeRate' => 0.4]);

        $kept = patchJson(jobCodeRateOverrideUrl($this->group, 'TBA'), ['salary' => 200]);
        $cleared = patchJson(jobCodeRateOverrideUrl($this->group, 'TBA'), ['fringeRate' => null]);

        expect($kept->json())->toEqual(['jobCode' => 'TBA', 'salary' => 200.0, 'fringeRate' => 0.4]);
        expect($cleared->json())->toEqual(['jobCode' => 'TBA', 'salary' => 200.0, 'fringeRate' => null]);
        expect(TermJobCodeRateOverride::count())->toBe(1);
    });

    it('deletes the override when both fields end up null', function () {
        patchJson(jobCodeRateOverrideUrl($this->group, 'TBA'), ['salary' => 100, 'fringeRate' => 0.4]);
        patchJson(jobCodeRateOverrideUrl($this->group, 'TBA'), ['salary' => null]);

        $res = patchJson(jobCodeRateOverrideUrl($this->group, 'TBA'), ['fringeRate' => null]);

        expect($res->json())->toBe(['jobCode' => 'TBA', 'salary' => null, 'fringeRate' => null]);
        expect(TermJobCodeRateOverride::count())->toBe(0);
    });

    it('records the acting user as creator and updater', function () {
        patchJson(jobCodeRateOverrideUrl($this->group, 'TBA'), ['salary' => 100]);

        $saved = TermJobCodeRateOverride::first();
        expect($saved->created_by)->toBe($this->groupManager->id);
        expect($saved->updated_by)->toBe($this->groupManager->id);
    });

    it('accepts a job code from the job_codes table', function () {
        JobCode::factory()->create(['code' => '9753']);

        expect(patchJson(jobCodeRateOverrideUrl($this->group, '9753'), ['salary' => 1])->status())->toBe(200);
    });

    it('accepts a job code held in the department, ignoring padding', function () {
        appointedEmployee('9402 ');

        expect(patchJson(jobCodeRateOverrideUrl($this->group, '9402'), ['salary' => 1])->status())->toBe(200);
    });

    it('returns 404 for a job code held only in another department', function () {
        appointedEmployee('9402', COST_API_OTHER_DEPT);

        expect(patchJson(jobCodeRateOverrideUrl($this->group, '9402'), ['salary' => 1])->status())->toBe(404);
    });

    it('returns 404 for an unknown job code', function () {
        expect(patchJson(jobCodeRateOverrideUrl($this->group, '0000'), ['salary' => 1])->status())->toBe(404);
    });

    it('rejects a negative salary, a salary with more than two decimals, and a fringe rate out of range', function () {
        expect(patchJson(jobCodeRateOverrideUrl($this->group, 'TBA'), ['salary' => -1])->status())->toBe(422);
        expect(patchJson(jobCodeRateOverrideUrl($this->group, 'TBA'), ['salary' => 12.345])->status())->toBe(422);
        expect(patchJson(jobCodeRateOverrideUrl($this->group, 'TBA'), ['fringeRate' => -0.1])->status())->toBe(422);
        expect(patchJson(jobCodeRateOverrideUrl($this->group, 'TBA'), ['fringeRate' => 5.1])->status())->toBe(422);
        expect(patchJson(jobCodeRateOverrideUrl($this->group, 'TBA'), ['fringeRate' => 0.38512])->status())->toBe(422);
        expect(TermJobCodeRateOverride::count())->toBe(0);
    });

    it('rejects a body with neither field', function () {
        expect(patchJson(jobCodeRateOverrideUrl($this->group, 'TBA'), [])->status())->toBe(422);
    });

    it('returns 404 for a group with no department', function () {
        $group = Group::factory()->create(['dept_id' => null]);
        Membership::factory()->create(['user_id' => $this->groupManager->id, 'group_id' => $group->id, 'admin' => true]);

        expect(patchJson(jobCodeRateOverrideUrl($group, 'TBA'), ['salary' => 1])->status())->toBe(404);
    });

    it('ignores an override saved by another department', function () {
        TermJobCodeRateOverride::create([
            'academic_org' => COST_API_OTHER_DEPT,
            'term_code' => TERM_FALL_2026,
            'job_code' => 'TBA',
            'salary' => 99999,
        ]);

        expect(getJson(costAssumptionsUrl($this->group))->json('rateOverrides.jobCodes'))->toBe([]);
    });
});

describe('person rates', function () {
    beforeEach(function () {
        actingAs($this->groupManager);
    });

    it('saves a salary and lists it for its own term only', function () {
        $res = putJson(personRateOverrideUrl($this->group, '100000001'), ['salary' => 7000.5]);

        expect($res->status())->toBe(200);
        expect($res->json())->toBe(['emplid' => 100000001, 'salary' => 7000.5]);
        expect(getJson(costAssumptionsUrl($this->group))->json('rateOverrides.people'))
            ->toBe([['emplid' => 100000001, 'salary' => 7000.5]]);
        expect(getJson(costAssumptionsUrl($this->group, 1273))->json('rateOverrides.people'))->toBe([]);
    });

    it('lists overrides ordered by emplid', function () {
        putJson(personRateOverrideUrl($this->group, '100000003'), ['salary' => 3]);
        putJson(personRateOverrideUrl($this->group, '100000001'), ['salary' => 1]);

        $emplids = collect(getJson(costAssumptionsUrl($this->group))->json('rateOverrides.people'))->pluck('emplid');

        expect($emplids->all())->toBe([100000001, 100000003]);
    });

    it('updates the same override instead of adding a row', function () {
        putJson(personRateOverrideUrl($this->group, '100000001'), ['salary' => 1]);
        putJson(personRateOverrideUrl($this->group, '100000001'), ['salary' => 2]);

        expect(TermPersonRateOverride::count())->toBe(1);
        expect(TermPersonRateOverride::first()->salary)->toBe(2.0);
    });

    it('deletes the override when the salary is null', function () {
        putJson(personRateOverrideUrl($this->group, '100000001'), ['salary' => 100]);

        $res = putJson(personRateOverrideUrl($this->group, '100000001'), ['salary' => null]);

        expect($res->json())->toBe(['emplid' => 100000001, 'salary' => null]);
        expect(TermPersonRateOverride::count())->toBe(0);
    });

    it('returns 404 for an emplid that is not a positive whole number', function () {
        expect(putJson(personRateOverrideUrl($this->group, 'abc'), ['salary' => 1])->status())->toBe(404);
        expect(putJson(personRateOverrideUrl($this->group, '0'), ['salary' => 1])->status())->toBe(404);
    });

    it('rejects a negative salary and a body that omits it', function () {
        expect(putJson(personRateOverrideUrl($this->group, '100000001'), ['salary' => -1])->status())->toBe(422);
        expect(putJson(personRateOverrideUrl($this->group, '100000001'), [])->status())->toBe(422);
    });

    it('ignores an override saved by another department', function () {
        TermPersonRateOverride::create([
            'academic_org' => COST_API_OTHER_DEPT,
            'term_code' => TERM_FALL_2026,
            'emplid' => 100000001,
            'salary' => 1,
        ]);

        expect(getJson(costAssumptionsUrl($this->group))->json('rateOverrides.people'))->toBe([]);
    });
});

describe('person notes', function () {
    beforeEach(function () {
        actingAs($this->groupManager);
    });

    it('saves a note and lists it for its own term only', function () {
        $res = putJson(personNoteUrl($this->group, '100000001'), ['notes' => 'On sabbatical in spring']);

        expect($res->status())->toBe(200);
        expect($res->json())->toBe(['emplid' => 100000001, 'notes' => 'On sabbatical in spring']);
        expect(getJson(costAssumptionsUrl($this->group))->json('personNotes'))
            ->toBe([['emplid' => 100000001, 'notes' => 'On sabbatical in spring']]);
        expect(getJson(costAssumptionsUrl($this->group, 1273))->json('personNotes'))->toBe([]);
    });

    it('updates the same note instead of adding a row, and records the acting user', function () {
        putJson(personNoteUrl($this->group, '100000001'), ['notes' => 'first']);
        putJson(personNoteUrl($this->group, '100000001'), ['notes' => 'second']);

        expect(TermPersonNote::count())->toBe(1);
        expect(TermPersonNote::first()->notes)->toBe('second');
        expect(TermPersonNote::first()->created_by)->toBe($this->groupManager->id);
    });

    it('deletes the note when it is null, empty, or only whitespace', function () {
        foreach ([null, '', "  \n "] as $emptyNotes) {
            putJson(personNoteUrl($this->group, '100000001'), ['notes' => 'something']);

            $res = putJson(personNoteUrl($this->group, '100000001'), ['notes' => $emptyNotes]);

            expect($res->json())->toBe(['emplid' => 100000001, 'notes' => null]);
            expect(TermPersonNote::count())->toBe(0);
        }
    });

    it('rejects a note over 2000 characters and a body that omits it', function () {
        expect(putJson(personNoteUrl($this->group, '100000001'), ['notes' => str_repeat('a', 2001)])->status())->toBe(422);
        expect(putJson(personNoteUrl($this->group, '100000001'), [])->status())->toBe(422);
    });

    it('returns 404 for an emplid that is not a positive whole number', function () {
        expect(putJson(personNoteUrl($this->group, 'abc'), ['notes' => 'x'])->status())->toBe(404);
    });

    it('ignores a note saved by another department', function () {
        TermPersonNote::create([
            'academic_org' => COST_API_OTHER_DEPT,
            'term_code' => TERM_FALL_2026,
            'emplid' => 100000001,
            'notes' => 'elsewhere',
        ]);

        expect(getJson(costAssumptionsUrl($this->group))->json('personNotes'))->toBe([]);
    });
});

describe('published terms', function () {
    beforeEach(function () {
        SisClassSection::factory()->create(['academic_org' => COST_API_DEPT, 'term_code' => TERM_FALL_2026]);
        actingAs($this->coursesEditor);
    });

    it('refuses a job code rate override', function () {
        expect(patchJson(jobCodeRateOverrideUrl($this->group, 'TBA'), ['salary' => 13000])->status())->toBe(403);
    });

    it('refuses a person salary override', function () {
        expect(putJson(personRateOverrideUrl($this->group, '100000001'), ['salary' => 13000])->status())->toBe(403);
    });

    it('refuses a person note', function () {
        expect(putJson(personNoteUrl($this->group, '100000001'), ['notes' => 'x'])->status())->toBe(403);
    });
});

describe('GET enrollment-history', function () {
    beforeEach(function () {
        actingAs($this->groupManager);
    });

    it('lists the ten fall and spring terms before the requested term, oldest first', function () {
        foreach ([1213, 1219, 1223, 1229, 1233, 1239, 1243, 1245, 1249, 1253, 1259, 1263, 1269] as $termCode) {
            enrollmentHistorySection($termCode);
        }

        $res = getJson(enrollmentHistoryUrl($this->group));

        expect($res->json('termCodes'))->toBe([1219, 1223, 1229, 1233, 1239, 1243, 1249, 1253, 1259, 1263]);
    });

    it('leaves out a cancelled section', function () {
        enrollmentHistorySection(1263, ['course_code' => 'ANTH-1001']);
        enrollmentHistorySection(1263, ['course_code' => 'ANTH-2001', 'is_cancelled' => true]);

        $courseCodes = collect(getJson(enrollmentHistoryUrl($this->group))->json('sections'))->pluck('courseCode');

        expect($courseCodes->all())->toBe(['ANTH-1001']);
    });

    it('leaves out a section of another department', function () {
        enrollmentHistorySection(1263, ['course_code' => 'ANTH-1001']);
        enrollmentHistorySection(1263, ['course_code' => 'HIST-1001', 'academic_org' => COST_API_OTHER_DEPT]);

        $courseCodes = collect(getJson(enrollmentHistoryUrl($this->group))->json('sections'))->pluck('courseCode');

        expect($courseCodes->all())->toBe(['ANTH-1001']);
    });

    it('describes a section with its counts, lead instructor, and meetings', function () {
        $section = enrollmentHistorySection(1263, [
            'course_code' => 'ANTH-1001',
            'class_section' => '002',
            'enrollment_total' => 31,
            'enrollment_cap' => 40,
            'waitlist_total' => 3,
        ]);
        $lead = SisEmployee::factory()->create(['last_name' => 'García']);
        SisClassInstructor::factory()->create(['sis_class_section_id' => $section->id, 'emplid' => $lead->emplid, 'role' => 'PI']);
        SisClassMeeting::factory()->create([
            'sis_class_section_id' => $section->id,
            'starts_at' => '10:10:00',
            'ends_at' => '11:00:00',
            'meets_monday' => true,
            'meets_wednesday' => true,
            'meets_friday' => true,
        ]);

        $row = getJson(enrollmentHistoryUrl($this->group))->json('sections.0');

        expect($row)->toBe([
            'courseCode' => 'ANTH-1001',
            'section' => '002',
            'termCode' => 1263,
            'enrollmentTotal' => 31,
            'enrollmentCap' => 40,
            'waitlistTotal' => 3,
            'leadInstructorLastName' => 'García',
            'meetings' => [['days' => ['mon', 'wed', 'fri'], 'startTime' => '10:10', 'endTime' => '11:00']],
        ]);
    });

    it('reports no lead instructor when only a TA is assigned', function () {
        $section = enrollmentHistorySection(1263);
        SisClassInstructor::factory()->create(['sis_class_section_id' => $section->id, 'role' => 'TA']);

        expect(getJson(enrollmentHistoryUrl($this->group))->json('sections.0.leadInstructorLastName'))->toBeNull();
    });
});
