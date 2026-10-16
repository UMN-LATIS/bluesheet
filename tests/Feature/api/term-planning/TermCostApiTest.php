<?php

use App\Constants\Permissions;
use App\GradAppointmentLevel;
use App\GradTermRate;
use App\Group;
use App\JobCode;
use App\JobCodeTermRate;
use App\Library\TermPlan\StudentStatus;
use App\Membership;
use App\SisAppointment;
use App\SisClassInstructor;
use App\SisClassMeeting;
use App\SisClassSection;
use App\SisDepartment;
use App\SisEmployee;
use App\TermGradPerson;
use App\TermPersonInput;
use App\TermSectionPayOverride;
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

const NO_COST_INPUTS = [
    'salary' => null,
    'fringeRate' => null,
    'hourlyRate' => null,
    'hours' => null,
    'healthRate' => null,
    'tuitionPerHour' => null,
    'feeOffset' => null,
    'internationalOffset' => null,
    'perCreditPayment' => null,
    'creditsTaught' => null,
];

function personInputsUrl(Group $group, string $emplid): string {
    return "/api/term-planning/groups/{$group->id}/person-inputs/{$emplid}?term=" . TERM_FALL_2026;
}

function sectionPayOverridesUrl(Group $group): string {
    return "/api/term-planning/groups/{$group->id}/section-pay-overrides?term=" . TERM_FALL_2026;
}

function sectionPayOverrideBody(array $pay): array {
    return ['courseCode' => 'ANTH-1001', 'section' => '001', 'emplid' => 100000001, ...$pay];
}

function gradPersonUrl(Group $group, string $emplid): string {
    return "/api/term-planning/groups/{$group->id}/grad-people/{$emplid}?term=" . TERM_FALL_2026;
}

function gradTermRateWithLevels(int $termCode = TERM_FALL_2026, array $levels = [25 => 196, 50 => 392]): GradTermRate {
    GradTermRate::where('term_code', $termCode)->delete();
    $gradTermRate = GradTermRate::factory()->create(['term_code' => $termCode]);
    foreach ($levels as $appointmentPercent => $hours) {
        GradAppointmentLevel::factory()->create([
            'grad_term_rate_id' => $gradTermRate->id,
            'appointment_percent' => $appointmentPercent,
            'hours' => $hours,
        ]);
    }

    return $gradTermRate;
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

        expect(patchJson(personInputsUrl($this->group, '100000001'), ['salary' => 1])->status())->toBe(403);
        expect(patchJson(personInputsUrl($this->group, '100000001'), ['notes' => 'x'])->status())->toBe(403);
        expect(putJson(gradPersonUrl($this->group, '100000001'), ['hasFeeOffset' => true, 'isInternational' => false])->status())->toBe(403);
    });

    it('lets a courses editor save every override', function () {
        actingAs($this->coursesEditor);

        expect(patchJson(personInputsUrl($this->group, '100000001'), ['salary' => 1])->status())->toBe(200);
        expect(patchJson(personInputsUrl($this->group, '100000001'), ['notes' => 'x'])->status())->toBe(200);
    });
});

describe('job code rates', function () {
    beforeEach(function () {
        actingAs($this->groupManager);
    });

    it('describes a job code with its type, and lists the migrated TBA row', function () {
        $rows = collect(getJson(costAssumptionsUrl($this->group))->json('jobCodeRates'))->keyBy('code');

        expect($rows['9519'])->toMatchArray(['instructorType' => 'teaching_assistant']);
        expect($rows['TBA'])->toMatchArray(['instructorType' => null]);
    });

    it('reports the salary and fringe rate of the rate for exactly the requested term', function () {
        $jobCode = JobCode::factory()->create(['code' => 'X101']);
        JobCodeTermRate::factory()->create(['job_code_id' => $jobCode->id, 'term_code' => 1259, 'salary' => 9000]);
        JobCodeTermRate::factory()->create([
            'job_code_id' => $jobCode->id,
            'term_code' => TERM_FALL_2026,
            'salary' => 5870.2,
            'fringe_rate' => 1.1264,
        ]);
        JobCodeTermRate::factory()->create(['job_code_id' => $jobCode->id, 'term_code' => 1273, 'salary' => 11000]);

        $row = collect(getJson(costAssumptionsUrl($this->group))->json('jobCodeRates'))->firstWhere('code', 'X101');

        expect($row['code'])->toBe($jobCode->code);
        expect($row['salary'])->toBe(5870.2);
        expect($row['fringeRate'])->toBe(1.1264);
    });

    it('reports a null salary and fringe rate for a term with no rate, without falling back to an earlier term', function () {
        $jobCode = JobCode::factory()->create(['code' => 'X101']);
        JobCodeTermRate::factory()->create(['job_code_id' => $jobCode->id, 'term_code' => 1259]);

        $row = collect(getJson(costAssumptionsUrl($this->group))->json('jobCodeRates'))->firstWhere('code', 'X101');

        expect($row['salary'])->toBeNull();
        expect($row['fringeRate'])->toBeNull();
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

describe('person inputs', function () {
    beforeEach(function () {
        actingAs($this->groupManager);
    });

    it('saves inputs and lists them for their own term only', function () {
        $res = patchJson(personInputsUrl($this->group, '100000001'), [
            'notes' => 'On sabbatical in spring',
            'yearStarted' => 2019,
            'courseReleases' => 2,
            'releaseSource' => 'Chair',
        ]);
        $saved = [
            'emplid' => 100000001,
            'notes' => 'On sabbatical in spring',
            'yearStarted' => 2019,
            'courseReleases' => 2,
            'releaseSource' => 'Chair',
            ...NO_COST_INPUTS,
        ];

        expect($res->status())->toBe(200);
        expect($res->json())->toBe($saved);
        expect(getJson(costAssumptionsUrl($this->group))->json('personInputs'))->toBe([$saved]);
        expect(getJson(costAssumptionsUrl($this->group, 1273))->json('personInputs'))->toBe([]);
    });

    it('lists inputs ordered by emplid', function () {
        patchJson(personInputsUrl($this->group, '100000003'), ['notes' => 'c']);
        patchJson(personInputsUrl($this->group, '100000001'), ['notes' => 'a']);

        $emplids = collect(getJson(costAssumptionsUrl($this->group))->json('personInputs'))->pluck('emplid');

        expect($emplids->all())->toBe([100000001, 100000003]);
    });

    it('changes only the keys it is sent', function () {
        patchJson(personInputsUrl($this->group, '100000001'), ['notes' => 'keep me', 'yearStarted' => 2019]);

        $res = patchJson(personInputsUrl($this->group, '100000001'), ['courseReleases' => 1]);

        expect($res->json())->toBe([
            'emplid' => 100000001,
            'notes' => 'keep me',
            'yearStarted' => 2019,
            'courseReleases' => 1,
            'releaseSource' => null,
            ...NO_COST_INPUTS,
        ]);
        expect(TermPersonInput::count())->toBe(1);
    });

    it('clears one input with null and leaves the others', function () {
        patchJson(personInputsUrl($this->group, '100000001'), ['notes' => 'keep me', 'yearStarted' => 2019]);

        $res = patchJson(personInputsUrl($this->group, '100000001'), ['yearStarted' => null]);

        expect($res->json('yearStarted'))->toBeNull();
        expect($res->json('notes'))->toBe('keep me');
    });

    it('records the acting user as creator and updater', function () {
        patchJson(personInputsUrl($this->group, '100000001'), ['notes' => 'first']);

        expect(TermPersonInput::first()->created_by)->toBe($this->groupManager->id);
        expect(TermPersonInput::first()->updated_by)->toBe($this->groupManager->id);
    });

    it('stores a blank string as null', function () {
        $res = patchJson(personInputsUrl($this->group, '100000001'), ['notes' => 'x', 'releaseSource' => "  \n "]);

        expect($res->json('releaseSource'))->toBeNull();
        expect(TermPersonInput::first()->release_source)->toBeNull();
    });

    it('deletes the row when every input ends up null', function () {
        patchJson(personInputsUrl($this->group, '100000001'), ['notes' => 'x', 'courseReleases' => 0]);
        patchJson(personInputsUrl($this->group, '100000001'), ['notes' => '']);

        $res = patchJson(personInputsUrl($this->group, '100000001'), ['courseReleases' => null]);

        expect($res->json())->toBe([
            'emplid' => 100000001,
            'notes' => null,
            'yearStarted' => null,
            'courseReleases' => null,
            'releaseSource' => null,
            ...NO_COST_INPUTS,
        ]);
        expect(TermPersonInput::count())->toBe(0);
    });

    it('saves every cost input and reports it as a number', function () {
        $costInputs = [
            'salary' => 7000.5,
            'fringeRate' => 0.385,
            'hourlyRate' => 22.75,
            'hours' => 520,
            'healthRate' => 0,
            'tuitionPerHour' => 1450,
            'feeOffset' => 300.25,
            'internationalOffset' => 150,
            'perCreditPayment' => 1200,
            'creditsTaught' => 4,
        ];

        $res = patchJson(personInputsUrl($this->group, '100000001'), $costInputs);

        expect($res->status())->toBe(200);
        expect($res->json())->toBe(['emplid' => 100000001, 'notes' => null, 'yearStarted' => null, 'courseReleases' => null, 'releaseSource' => null, ...$costInputs]);
        expect(getJson(costAssumptionsUrl($this->group))->json('personInputs.0'))->toBe($res->json());
    });

    it('clears a cost input with null and keeps the others', function () {
        patchJson(personInputsUrl($this->group, '100000001'), ['salary' => 100, 'hours' => 10]);

        $res = patchJson(personInputsUrl($this->group, '100000001'), ['salary' => null]);

        expect($res->json('salary'))->toBeNull();
        expect($res->json('hours'))->toBe(10);
        expect(TermPersonInput::count())->toBe(1);
    });

    it('deletes the row when the only cost input is cleared', function () {
        patchJson(personInputsUrl($this->group, '100000001'), ['salary' => 100]);
        patchJson(personInputsUrl($this->group, '100000001'), ['salary' => null]);

        expect(TermPersonInput::count())->toBe(0);
    });

    it('accepts a fraction of 0 and 5 and rejects 6 or a negative', function () {
        expect(patchJson(personInputsUrl($this->group, '100000001'), ['healthRate' => 0])->status())->toBe(200);
        expect(patchJson(personInputsUrl($this->group, '100000001'), ['fringeRate' => 5])->status())->toBe(200);
        expect(patchJson(personInputsUrl($this->group, '100000001'), ['healthRate' => 6])->status())->toBe(422);
        expect(patchJson(personInputsUrl($this->group, '100000001'), ['fringeRate' => -0.1])->status())->toBe(422);
        expect(patchJson(personInputsUrl($this->group, '100000001'), ['fringeRate' => 0.12345])->status())->toBe(422);
    });

    it('bounds hours, credits taught, and money', function () {
        expect(patchJson(personInputsUrl($this->group, '100000001'), ['hours' => 2080])->status())->toBe(200);
        expect(patchJson(personInputsUrl($this->group, '100000001'), ['hours' => 2081])->status())->toBe(422);
        expect(patchJson(personInputsUrl($this->group, '100000001'), ['hours' => -1])->status())->toBe(422);
        expect(patchJson(personInputsUrl($this->group, '100000001'), ['hours' => 1.5])->status())->toBe(422);
        expect(patchJson(personInputsUrl($this->group, '100000001'), ['creditsTaught' => 40])->status())->toBe(200);
        expect(patchJson(personInputsUrl($this->group, '100000001'), ['creditsTaught' => 41])->status())->toBe(422);
        expect(patchJson(personInputsUrl($this->group, '100000001'), ['salary' => -1])->status())->toBe(422);
        expect(patchJson(personInputsUrl($this->group, '100000001'), ['hourlyRate' => 100000000])->status())->toBe(422);
        expect(patchJson(personInputsUrl($this->group, '100000001'), ['tuitionPerHour' => 'abc'])->status())->toBe(422);
    });

    it('rejects an empty body and a body with no known key', function () {
        expect(patchJson(personInputsUrl($this->group, '100000001'), [])->status())->toBe(422);
        expect(patchJson(personInputsUrl($this->group, '100000001'), ['unknown' => 1])->status())->toBe(422);
    });

    it('rejects values out of range', function () {
        expect(patchJson(personInputsUrl($this->group, '100000001'), ['notes' => str_repeat('a', 2001)])->status())->toBe(422);
        expect(patchJson(personInputsUrl($this->group, '100000001'), ['releaseSource' => str_repeat('a', 256)])->status())->toBe(422);
        expect(patchJson(personInputsUrl($this->group, '100000001'), ['yearStarted' => 1949])->status())->toBe(422);
        expect(patchJson(personInputsUrl($this->group, '100000001'), ['courseReleases' => 21])->status())->toBe(422);
        expect(TermPersonInput::count())->toBe(0);
    });

    it('returns 404 for an emplid that is not a positive whole number', function () {
        expect(patchJson(personInputsUrl($this->group, 'abc'), ['notes' => 'x'])->status())->toBe(404);
    });

    it('refuses a user who cannot edit the group', function () {
        actingAs($this->coursesViewer);

        expect(patchJson(personInputsUrl($this->group, '100000001'), ['notes' => 'x'])->status())->toBe(403);
        expect(TermPersonInput::count())->toBe(0);
    });

    it('ignores an input saved by another department', function () {
        TermPersonInput::create([
            'academic_org' => COST_API_OTHER_DEPT,
            'term_code' => TERM_FALL_2026,
            'emplid' => 100000001,
            'notes' => 'elsewhere',
        ]);

        expect(getJson(costAssumptionsUrl($this->group))->json('personInputs'))->toBe([]);
    });
});

describe('section pay overrides', function () {
    beforeEach(function () {
        actingAs($this->groupManager);
    });

    it('sets a salary and lists it in the payload', function () {
        $res = patchJson(sectionPayOverridesUrl($this->group), sectionPayOverrideBody(['salary' => 5000]));
        $saved = [
            'courseCode' => 'ANTH-1001',
            'section' => '001',
            'emplid' => 100000001,
            'salary' => 5000,
            'fringeRate' => null,
            'appointmentPercent' => null,
        ];

        expect($res->status())->toBe(200);
        expect($res->json())->toBe($saved);
        expect(getJson(costAssumptionsUrl($this->group))->json('sectionPayOverrides'))->toBe([$saved]);
    });

    it('keeps the other column when only one is sent', function () {
        patchJson(sectionPayOverridesUrl($this->group), sectionPayOverrideBody(['appointmentPercent' => 25.5]));

        $res = patchJson(sectionPayOverridesUrl($this->group), sectionPayOverrideBody(['salary' => 5000]));

        expect($res->json('salary'))->toBe(5000);
        expect($res->json('appointmentPercent'))->toBe(25.5);
        expect(TermSectionPayOverride::count())->toBe(1);
    });

    it('deletes the row when both columns are cleared', function () {
        patchJson(sectionPayOverridesUrl($this->group), sectionPayOverrideBody(['salary' => 5000]));

        $res = patchJson(sectionPayOverridesUrl($this->group), sectionPayOverrideBody(['salary' => null]));

        expect($res->status())->toBe(200);
        expect($res->json('salary'))->toBeNull();
        expect($res->json('fringeRate'))->toBeNull();
        expect($res->json('appointmentPercent'))->toBeNull();
        expect(TermSectionPayOverride::count())->toBe(0);
    });

    it('keeps a fringe rate with no salary, and clearing the salary keeps the row', function () {
        patchJson(sectionPayOverridesUrl($this->group), sectionPayOverrideBody(['salary' => 5000, 'fringeRate' => 0.12]));

        $res = patchJson(sectionPayOverridesUrl($this->group), sectionPayOverrideBody(['salary' => null]));

        expect($res->json('fringeRate'))->toBe(0.12);
        expect(TermSectionPayOverride::count())->toBe(1);
    });

    it('rejects a body with no pay field', function () {
        expect(patchJson(sectionPayOverridesUrl($this->group), sectionPayOverrideBody([]))->status())->toBe(422);
        expect(TermSectionPayOverride::count())->toBe(0);
    });

    it('refuses a user who cannot edit the group', function () {
        actingAs($this->basicUser);

        expect(patchJson(sectionPayOverridesUrl($this->group), sectionPayOverrideBody(['salary' => 1]))->status())->toBe(403);
        expect(TermSectionPayOverride::count())->toBe(0);
    });
});

describe('grad rates in the payload', function () {
    beforeEach(function () {
        actingAs($this->groupManager);
    });

    it('reports a job code student status', function () {
        JobCode::where('code', '9511')->update(['student_status' => StudentStatus::Abd]);

        $rows = collect(getJson(costAssumptionsUrl($this->group))->json('jobCodeRates'))->keyBy('code');

        expect($rows['9511']['studentStatus'])->toBe('abd');
        expect($rows['TBA']['studentStatus'])->toBeNull();
    });

    it('reports no defaults and no levels for a term without grad rates', function () {
        GradTermRate::where('term_code', TERM_FALL_2026)->delete();

        $res = getJson(costAssumptionsUrl($this->group));

        expect($res->json('gradRates'))->toBe(['defaultAppointmentPercent' => null, 'defaults' => null, 'levels' => []]);
        expect($res->json())->not->toHaveKey('rateOverrides');
        expect($res->json('gradPeople'))->toBe([]);
    });

    it('reports the inputs and levels of exactly the requested term, levels ordered by percent', function () {
        gradTermRateWithLevels(TERM_FALL_2026, [50 => 392, '12.5' => 98]);
        gradTermRateWithLevels(1273, [25 => 194]);

        $gradRates = getJson(costAssumptionsUrl($this->group))->json('gradRates');

        expect($gradRates['defaultAppointmentPercent'])->toEqual(25.0);
        expect($gradRates['defaults'])->toEqual([
            'hourlyRate' => 29.95,
            'healthRate' => 0.289,
            'tuitionPerHourRegular' => 25.08,
            'tuitionPerHourAbd' => 3.98,
            'feeOffset' => 235.0,
            'internationalOffset' => 280.0,
            'perCreditPayment' => 250.0,
        ]);
        expect($gradRates['levels'])->toEqual([
            ['appointmentPercent' => 12.5, 'hours' => 98],
            ['appointmentPercent' => 50.0, 'hours' => 392],
        ]);
    });

    it('lists the department-term grad people, and none from another department', function () {
        gradTermRateWithLevels();
        putJson(gradPersonUrl($this->group, '100000001'), ['hasFeeOffset' => true, 'isInternational' => false]);
        TermGradPerson::create(['academic_org' => COST_API_OTHER_DEPT, 'term_code' => TERM_FALL_2026, 'emplid' => 100000002, 'has_fee_offset' => true]);

        $res = getJson(costAssumptionsUrl($this->group));

        expect($res->json('gradPeople'))->toEqual([
            ['emplid' => 100000001, 'hasFeeOffset' => true, 'isInternational' => false],
        ]);
    });
});

describe('grad people', function () {
    beforeEach(function () {
        actingAs($this->groupManager);
        gradTermRateWithLevels();
    });

    it('saves the two offset flags', function () {
        $body = ['hasFeeOffset' => true, 'isInternational' => true];

        $res = putJson(gradPersonUrl($this->group, '100000001'), $body);

        expect($res->json())->toEqual(['emplid' => 100000001, 'hasFeeOffset' => true, 'isInternational' => true]);
        expect(TermGradPerson::count())->toBe(1);
        expect(TermGradPerson::first()->created_by)->toBe($this->groupManager->id);
    });

    it('updates the row in place when a flag changes', function () {
        putJson(gradPersonUrl($this->group, '100000001'), ['hasFeeOffset' => true, 'isInternational' => false]);
        putJson(gradPersonUrl($this->group, '100000001'), ['hasFeeOffset' => false, 'isInternational' => true]);

        expect(TermGradPerson::count())->toBe(1);
        expect(TermGradPerson::first()->is_international)->toBeTrue();
        expect(TermGradPerson::first()->has_fee_offset)->toBeFalse();
    });

    it('deletes the row when both flags are false', function () {
        putJson(gradPersonUrl($this->group, '100000001'), ['hasFeeOffset' => true, 'isInternational' => false]);

        putJson(gradPersonUrl($this->group, '100000001'), ['hasFeeOffset' => false, 'isInternational' => false]);

        expect(TermGradPerson::count())->toBe(0);
    });

    it('rejects missing fields and non-boolean flags', function () {
        $valid = ['hasFeeOffset' => false, 'isInternational' => false];

        expect(putJson(gradPersonUrl($this->group, '100000001'), ['hasFeeOffset' => false])->status())->toBe(422);
        expect(putJson(gradPersonUrl($this->group, '100000001'), [...$valid, 'isInternational' => 'maybe'])->status())->toBe(422);
        expect(TermGradPerson::count())->toBe(0);
    });

    it('returns 404 for an emplid that is not a positive whole number', function () {
        $body = ['hasFeeOffset' => true, 'isInternational' => false];

        expect(putJson(gradPersonUrl($this->group, 'abc'), $body)->status())->toBe(404);
    });
});

describe('published terms keep their budget editable', function () {
    beforeEach(function () {
        SisClassSection::factory()->create(['academic_org' => COST_API_DEPT, 'term_code' => TERM_FALL_2026]);
        actingAs($this->coursesEditor);
    });

    it('saves a person salary override', function () {
        expect(patchJson(personInputsUrl($this->group, '100000001'), ['salary' => 13000])->status())->toBe(200);
        expect(TermPersonInput::where('emplid', 100000001)->value('salary'))->toEqual(13000);
    });

    it('saves a grad person edit', function () {
        gradTermRateWithLevels();

        expect(putJson(gradPersonUrl($this->group, '100000001'), ['hasFeeOffset' => true, 'isInternational' => true])->status())->toBe(200);
        expect(TermGradPerson::count())->toBe(1);
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
