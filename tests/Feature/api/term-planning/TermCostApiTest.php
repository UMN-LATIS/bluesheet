<?php

use App\Constants\Permissions;
use App\Group;
use App\JobCode;
use App\JobCodeRate;
use App\Library\TermPlan\InstructorType;
use App\Library\TermPlan\StudentStatus;
use App\Library\TermPlan\Season;
use App\Membership;
use App\SisAppointment;
use App\SisClassInstructor;
use App\SisClassMeeting;
use App\SisClassSection;
use App\SisDepartment;
use App\SisEmployee;
use App\TaAppointmentRate;
use App\LocalClassSection;
use App\TermCostLineOverride;
use App\TermJobCodeRateOverride;
use App\TermTaRateOverride;
use App\User;
use Database\Seeders\TestDatabaseSeeder;

use function Pest\Laravel\{actingAs, getJson, putJson};

const TERM_FALL_2026 = 1269;
const TERM_SPRING_2026 = 1263;
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

function jobCodeRateOverrideUrl(Group $group, string $jobCode, int $term = TERM_FALL_2026): string {
    return "/api/term-planning/groups/{$group->id}/cost-rate-overrides/job-codes/{$jobCode}?term={$term}";
}

function taRateOverrideUrl(Group $group, string $appointmentPercent, string $studentStatus = 'regular', int $term = TERM_FALL_2026): string {
    return "/api/term-planning/groups/{$group->id}/cost-rate-overrides/ta-appointments/{$appointmentPercent}/{$studentStatus}?term={$term}";
}

function lineOverrideUrl(Group $group, int $term = TERM_FALL_2026): string {
    return "/api/term-planning/groups/{$group->id}/cost-line-overrides?term={$term}";
}

function lineOverrideBody(array $overrides = []): array {
    return [
        'courseCode' => 'ANTH-1001',
        'section' => '001',
        'emplid' => 100000001,
        'amount' => 4500.25,
        'reason' => 'Buyout',
        ...$overrides,
    ];
}

function localSection(array $attributes = []): LocalClassSection {
    return LocalClassSection::factory()->create([
        'academic_org' => COST_API_DEPT,
        'term_code' => TERM_FALL_2026,
        'course_code' => 'ANTH-1001',
        'class_section' => '001',
        ...$attributes,
    ]);
}

function sisSection(array $attributes = []): SisClassSection {
    return SisClassSection::factory()->create([
        'academic_org' => COST_API_DEPT,
        'term_code' => TERM_FALL_2026,
        'course_code' => 'ANTH-1001',
        'class_section' => '001',
        ...$attributes,
    ]);
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

describe('PUT authorization', function () {
    it('refuses a courses viewer on every override', function () {
        localSection();
        actingAs($this->coursesViewer);

        expect(putJson(jobCodeRateOverrideUrl($this->group, 'TBA'), ['costPerCourse' => 1])->status())->toBe(403);
        expect(putJson(taRateOverrideUrl($this->group, '25'), ['costPerTerm' => 1])->status())->toBe(403);
        expect(putJson(lineOverrideUrl($this->group), lineOverrideBody())->status())->toBe(403);
    });

    it('lets a courses editor save every override', function () {
        localSection();
        actingAs($this->coursesEditor);

        expect(putJson(jobCodeRateOverrideUrl($this->group, 'TBA'), ['costPerCourse' => 1])->status())->toBe(200);
        expect(putJson(taRateOverrideUrl($this->group, '25'), ['costPerTerm' => 1])->status())->toBe(200);
        expect(putJson(lineOverrideUrl($this->group), lineOverrideBody())->status())->toBe(200);
    });
});

describe('job code rates', function () {
    beforeEach(function () {
        actingAs($this->groupManager);
    });

    it('describes a job code with its type, annual load, and student status', function () {
        JobCode::factory()->create([
            'code' => '9519',
            'instructor_type' => InstructorType::TeachingAssistant,
            'annual_load' => 2,
            'student_status' => StudentStatus::Abd,
        ]);
        JobCode::factory()->create(['code' => JobCode::UNSTAFFED_CODE, 'instructor_type' => null, 'annual_load' => null]);

        $rows = collect(getJson(costAssumptionsUrl($this->group))->json('jobCodes'))->keyBy('code');

        expect($rows['9519'])->toMatchArray(['instructorType' => 'teaching_assistant', 'annualLoad' => 2, 'studentStatus' => 'abd']);
        expect($rows['TBA'])->toMatchArray(['instructorType' => null, 'annualLoad' => null, 'studentStatus' => null]);
    });

    it('carries the latest earlier fiscal year forward and ignores later ones', function () {
        $jobCode = JobCode::factory()->create();
        JobCodeRate::factory()->create(['job_code_id' => $jobCode->id, 'fiscal_year' => 2026, 'cost_per_course' => 9000]);
        JobCodeRate::factory()->create(['job_code_id' => $jobCode->id, 'fiscal_year' => 2028, 'cost_per_course' => 11000]);

        $row = getJson(costAssumptionsUrl($this->group))->json('jobCodes.0');

        expect($row['code'])->toBe($jobCode->code);
        expect($row['costPerCourse'])->toBe(9000);
        expect($row['rateFiscalYear'])->toBe(2026);
    });

    it('reports a null cost for a job code with no rate at or before the fiscal year', function () {
        $jobCode = JobCode::factory()->create();
        JobCodeRate::factory()->create(['job_code_id' => $jobCode->id, 'fiscal_year' => 2028]);

        $row = getJson(costAssumptionsUrl($this->group))->json('jobCodes.0');

        expect($row['costPerCourse'])->toBeNull();
        expect($row['rateFiscalYear'])->toBeNull();
    });

    it('reports each job code at its own latest rate year', function () {
        $codeA = JobCode::factory()->create(['code' => '1001']);
        $codeB = JobCode::factory()->create(['code' => '1002']);
        JobCodeRate::factory()->create(['job_code_id' => $codeA->id, 'fiscal_year' => 2026, 'cost_per_course' => 8000]);
        JobCodeRate::factory()->create(['job_code_id' => $codeB->id, 'fiscal_year' => 2026, 'cost_per_course' => 8500]);
        JobCodeRate::factory()->create(['job_code_id' => $codeB->id, 'fiscal_year' => 2027, 'cost_per_course' => 9500]);

        $rows = collect(getJson(costAssumptionsUrl($this->group))->json('jobCodes'))->keyBy('code');

        expect($rows['1001']['rateFiscalYear'])->toBe(2026);
        expect($rows['1002']['rateFiscalYear'])->toBe(2027);
        expect($rows['1002']['costPerCourse'])->toBe(9500);
    });
});

describe('TA rates', function () {
    beforeEach(function () {
        actingAs($this->groupManager);
    });

    it('returns only the rows of the latest fiscal year entered at or before the term', function () {
        TaAppointmentRate::factory()->create(['fiscal_year' => 2026, 'season' => Season::Fall, 'appointment_percent' => 25]);
        TaAppointmentRate::factory()->create(['fiscal_year' => 2027, 'season' => Season::Spring, 'appointment_percent' => 50]);

        $taRates = getJson(costAssumptionsUrl($this->group))->json('taRates');

        expect($taRates['fiscalYear'])->toBe(2027);
        expect($taRates['rates'])->toHaveCount(1);
        expect($taRates['rates'][0])->toMatchArray(['season' => 'spring', 'appointmentPercent' => 50.0]);
    });

    it('reports a null fiscal year and no rows when nothing is entered at or before the term', function () {
        TaAppointmentRate::factory()->create(['fiscal_year' => 2028]);

        $taRates = getJson(costAssumptionsUrl($this->group))->json('taRates');

        expect($taRates['fiscalYear'])->toBeNull();
        expect($taRates['rates'])->toBe([]);
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
        putJson(jobCodeRateOverrideUrl($this->group, 'TBA'), ['costPerCourse' => 12000.5]);

        expect(getJson(costAssumptionsUrl($this->group))->json('rateOverrides.jobCodes'))
            ->toBe([['jobCode' => 'TBA', 'costPerCourse' => 12000.5]]);
        expect(getJson(costAssumptionsUrl($this->group, 1273))->json('rateOverrides.jobCodes'))->toBe([]);
    });

    it('lists a TA override for its own term only', function () {
        $res = putJson(taRateOverrideUrl($this->group, '12.5', 'abd'), ['costPerTerm' => 5000]);

        expect($res->json())->toEqual(['appointmentPercent' => 12.5, 'studentStatus' => 'abd', 'costPerTerm' => 5000.0]);
        expect(getJson(costAssumptionsUrl($this->group))->json('rateOverrides.taAppointments'))
            ->toEqual([['appointmentPercent' => 12.5, 'studentStatus' => 'abd', 'costPerTerm' => 5000.0]]);
        expect(getJson(costAssumptionsUrl($this->group, 1273))->json('rateOverrides.taAppointments'))->toBe([]);
    });

    it('keeps regular and ABD overrides of one appointment percent apart', function () {
        putJson(taRateOverrideUrl($this->group, '25', 'regular'), ['costPerTerm' => 1]);
        putJson(taRateOverrideUrl($this->group, '25', 'abd'), ['costPerTerm' => 2]);

        expect(TermTaRateOverride::count())->toBe(2);
    });

    it('updates the same override instead of adding a row', function () {
        putJson(jobCodeRateOverrideUrl($this->group, 'TBA'), ['costPerCourse' => 100]);
        $res = putJson(jobCodeRateOverrideUrl($this->group, 'TBA'), ['costPerCourse' => 200]);

        expect($res->json())->toEqual(['jobCode' => 'TBA', 'costPerCourse' => 200.0]);
        expect(TermJobCodeRateOverride::count())->toBe(1);
    });

    it('deletes an override when the cost is null', function () {
        putJson(jobCodeRateOverrideUrl($this->group, 'TBA'), ['costPerCourse' => 100]);
        putJson(taRateOverrideUrl($this->group, '25'), ['costPerTerm' => 100]);

        $jobCodeRes = putJson(jobCodeRateOverrideUrl($this->group, 'TBA'), ['costPerCourse' => null]);
        $taRes = putJson(taRateOverrideUrl($this->group, '25'), ['costPerTerm' => null]);

        expect($jobCodeRes->json())->toBe(['jobCode' => 'TBA', 'costPerCourse' => null]);
        expect($taRes->json())->toEqual(['appointmentPercent' => 25.0, 'studentStatus' => 'regular', 'costPerTerm' => null]);
        expect(TermJobCodeRateOverride::count())->toBe(0);
        expect(TermTaRateOverride::count())->toBe(0);
    });

    it('records the acting user as creator and updater', function () {
        putJson(jobCodeRateOverrideUrl($this->group, 'TBA'), ['costPerCourse' => 100]);

        $saved = TermJobCodeRateOverride::first();
        expect($saved->created_by)->toBe($this->groupManager->id);
        expect($saved->updated_by)->toBe($this->groupManager->id);
    });

    it('accepts a job code from the job_codes table', function () {
        JobCode::factory()->create(['code' => '9753']);

        expect(putJson(jobCodeRateOverrideUrl($this->group, '9753'), ['costPerCourse' => 1])->status())->toBe(200);
    });

    it('accepts a job code held in the department, ignoring padding', function () {
        appointedEmployee('9402 ');

        expect(putJson(jobCodeRateOverrideUrl($this->group, '9402'), ['costPerCourse' => 1])->status())->toBe(200);
    });

    it('returns 404 for a job code held only in another department', function () {
        appointedEmployee('9402', COST_API_OTHER_DEPT);

        expect(putJson(jobCodeRateOverrideUrl($this->group, '9402'), ['costPerCourse' => 1])->status())->toBe(404);
    });

    it('returns 404 for an unknown job code', function () {
        expect(putJson(jobCodeRateOverrideUrl($this->group, '0000'), ['costPerCourse' => 1])->status())->toBe(404);
    });

    it('rejects a negative cost', function () {
        expect(putJson(jobCodeRateOverrideUrl($this->group, 'TBA'), ['costPerCourse' => -1])->status())->toBe(422);
        expect(putJson(taRateOverrideUrl($this->group, '25'), ['costPerTerm' => -1])->status())->toBe(422);
    });

    it('rejects a cost with more than two decimals', function () {
        expect(putJson(jobCodeRateOverrideUrl($this->group, 'TBA'), ['costPerCourse' => 12.345])->status())->toBe(422);
    });

    it('rejects a body that omits the cost', function () {
        expect(putJson(jobCodeRateOverrideUrl($this->group, 'TBA'), [])->status())->toBe(422);
    });

    it('returns 404 for an appointment percent of zero or over 100', function () {
        expect(putJson(taRateOverrideUrl($this->group, '0'), ['costPerTerm' => 1])->status())->toBe(404);
        expect(putJson(taRateOverrideUrl($this->group, '100.5'), ['costPerTerm' => 1])->status())->toBe(404);
        expect(putJson(taRateOverrideUrl($this->group, '101'), ['costPerTerm' => 1])->status())->toBe(404);
    });

    it('returns 404 for a malformed appointment percent', function () {
        expect(putJson(taRateOverrideUrl($this->group, '12.345'), ['costPerTerm' => 1])->status())->toBe(404);
        expect(putJson(taRateOverrideUrl($this->group, 'abc'), ['costPerTerm' => 1])->status())->toBe(404);
    });

    it('returns 404 for an unknown student status', function () {
        expect(putJson(taRateOverrideUrl($this->group, '25', 'bogus'), ['costPerTerm' => 1])->status())->toBe(404);
    });

    it('returns 404 for a group with no department', function () {
        $group = Group::factory()->create(['dept_id' => null]);
        Membership::factory()->create(['user_id' => $this->groupManager->id, 'group_id' => $group->id, 'admin' => true]);

        expect(putJson(jobCodeRateOverrideUrl($group, 'TBA'), ['costPerCourse' => 1])->status())->toBe(404);
    });

    it('ignores an override saved by another department', function () {
        TermJobCodeRateOverride::create([
            'academic_org' => COST_API_OTHER_DEPT,
            'term_code' => TERM_FALL_2026,
            'job_code' => 'TBA',
            'cost_per_course' => 99999,
        ]);

        expect(getJson(costAssumptionsUrl($this->group))->json('rateOverrides.jobCodes'))->toBe([]);
    });
});

describe('line overrides', function () {
    beforeEach(function () {
        actingAs($this->groupManager);
    });

    it('saves an override on a local section and lists it', function () {
        localSection();

        $res = putJson(lineOverrideUrl($this->group), lineOverrideBody());

        $expected = lineOverrideBody();
        expect($res->status())->toBe(200);
        expect($res->json())->toBe($expected);
        expect(getJson(costAssumptionsUrl($this->group))->json('lineOverrides'))->toBe([$expected]);
    });

    it('saves an override on a SIS section of a published term', function () {
        sisSection();

        expect(putJson(lineOverrideUrl($this->group), lineOverrideBody())->status())->toBe(200);
        expect(TermCostLineOverride::count())->toBe(1);
    });

    it('updates the same override instead of adding a row', function () {
        localSection();

        putJson(lineOverrideUrl($this->group), lineOverrideBody(['amount' => 1]));
        putJson(lineOverrideUrl($this->group), lineOverrideBody(['amount' => 2]));

        expect(TermCostLineOverride::count())->toBe(1);
        expect(TermCostLineOverride::first()->amount)->toBe(2.0);
    });

    it('lists an override only for its own term and department', function () {
        foreach ([[COST_API_DEPT, TERM_FALL_2026], [COST_API_DEPT, 1273], [COST_API_OTHER_DEPT, TERM_FALL_2026]] as [$academicOrg, $termCode]) {
            TermCostLineOverride::create([
                'academic_org' => $academicOrg,
                'term_code' => $termCode,
                'course_code' => 'ANTH-1001',
                'class_section' => '001',
                'emplid' => 100000001,
                'amount' => 1,
            ]);
        }

        expect(getJson(costAssumptionsUrl($this->group))->json('lineOverrides'))->toHaveCount(1);
        expect(getJson(costAssumptionsUrl($this->group, 1273))->json('lineOverrides'))->toHaveCount(1);
    });

    it('deletes the override when the amount is null', function () {
        localSection();
        putJson(lineOverrideUrl($this->group), lineOverrideBody());

        $res = putJson(lineOverrideUrl($this->group), lineOverrideBody(['amount' => null]));

        expect($res->json())->toBe(lineOverrideBody(['amount' => null, 'reason' => null]));
        expect(TermCostLineOverride::count())->toBe(0);
    });

    it('returns 404 for an unknown course or section', function () {
        localSection();

        expect(putJson(lineOverrideUrl($this->group), lineOverrideBody(['courseCode' => 'HIST-1001']))->status())->toBe(404);
        expect(putJson(lineOverrideUrl($this->group), lineOverrideBody(['section' => '002']))->status())->toBe(404);
    });

    it('returns 404 for a section of another department', function () {
        localSection(['academic_org' => COST_API_OTHER_DEPT]);
        sisSection(['academic_org' => COST_API_OTHER_DEPT, 'course_code' => 'HIST-1001']);

        expect(putJson(lineOverrideUrl($this->group), lineOverrideBody())->status())->toBe(404);
        expect(putJson(lineOverrideUrl($this->group), lineOverrideBody(['courseCode' => 'HIST-1001']))->status())->toBe(404);
    });

    it('returns 404 for a section of another term', function () {
        localSection(['term_code' => 1273]);

        expect(putJson(lineOverrideUrl($this->group), lineOverrideBody())->status())->toBe(404);
    });

    it('rejects an emplid of zero or more than nine digits', function () {
        localSection();

        expect(putJson(lineOverrideUrl($this->group), lineOverrideBody(['emplid' => 0]))->status())->toBe(422);
        expect(putJson(lineOverrideUrl($this->group), lineOverrideBody(['emplid' => 1234567890]))->status())->toBe(422);
    });

    it('rejects a negative amount and an over-long reason', function () {
        localSection();

        expect(putJson(lineOverrideUrl($this->group), lineOverrideBody(['amount' => -1]))->status())->toBe(422);
        expect(putJson(lineOverrideUrl($this->group), lineOverrideBody(['reason' => str_repeat('a', 1001)]))->status())->toBe(422);
    });

    it('rejects a body that omits a field', function () {
        localSection();
        $body = lineOverrideBody();
        unset($body['reason']);

        expect(putJson(lineOverrideUrl($this->group), $body)->status())->toBe(422);
    });
});

describe('published terms', function () {
    beforeEach(function () {
        SisClassSection::factory()->create(['academic_org' => COST_API_DEPT, 'term_code' => TERM_FALL_2026]);
        actingAs($this->coursesEditor);
    });

    it('still accepts a job code rate override', function () {
        expect(putJson(jobCodeRateOverrideUrl($this->group, 'TBA'), ['costPerCourse' => 13000])->status())->toBe(200);
    });

    it('still accepts a TA rate override', function () {
        expect(putJson(taRateOverrideUrl($this->group, '25'), ['costPerTerm' => 13000])->status())->toBe(200);
    });

    it('still accepts a line override', function () {
        sisSection();

        expect(putJson(lineOverrideUrl($this->group), lineOverrideBody())->status())->toBe(200);
    });
});

describe('GET enrollment-history', function () {
    beforeEach(function () {
        actingAs($this->groupManager);
    });

    it('lists the eight fall and spring terms before the requested term, oldest first', function () {
        foreach ([1223, 1229, 1233, 1239, 1243, 1245, 1249, 1253, 1259, 1263, 1269] as $termCode) {
            enrollmentHistorySection($termCode);
        }

        $res = getJson(enrollmentHistoryUrl($this->group));

        expect($res->json('termCodes'))->toBe([1229, 1233, 1239, 1243, 1249, 1253, 1259, 1263]);
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
