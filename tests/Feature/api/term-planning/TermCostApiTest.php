<?php

use App\Constants\Permissions;
use App\GradAppointmentLevel;
use App\GradTermRate;
use App\Group;
use App\JobCode;
use App\JobCodeTermRate;
use App\Library\TermPlan\InstructorType;
use App\Library\TermPlan\StudentStatus;
use App\Membership;
use App\SisAppointment;
use App\SisClassInstructor;
use App\SisClassMeeting;
use App\SisClassSection;
use App\SisDepartment;
use App\SisEmployee;
use App\TermGradHoursOverride;
use App\TermGradPerson;
use App\TermGradRateOverride;
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

function gradRateOverrideUrl(Group $group): string {
    return "/api/term-planning/groups/{$group->id}/cost-rate-overrides/grad?term=" . TERM_FALL_2026;
}

function gradHoursUrl(Group $group, string $appointmentPercent): string {
    return "/api/term-planning/groups/{$group->id}/cost-rate-overrides/grad-hours/{$appointmentPercent}?term=" . TERM_FALL_2026;
}

function gradPersonUrl(Group $group, string $emplid): string {
    return "/api/term-planning/groups/{$group->id}/grad-people/{$emplid}?term=" . TERM_FALL_2026;
}

function gradTermRateWithLevels(int $termCode = TERM_FALL_2026, array $levels = [25 => 196, 50 => 392]): GradTermRate {
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

        expect(patchJson(jobCodeRateOverrideUrl($this->group, 'TBA'), ['salary' => 1])->status())->toBe(403);
        expect(putJson(personRateOverrideUrl($this->group, '100000001'), ['salary' => 1])->status())->toBe(403);
        expect(putJson(personNoteUrl($this->group, '100000001'), ['notes' => 'x'])->status())->toBe(403);
        expect(patchJson(gradRateOverrideUrl($this->group), ['hourlyRate' => 1])->status())->toBe(403);
        expect(putJson(gradHoursUrl($this->group, '25'), ['hours' => 1])->status())->toBe(403);
        expect(putJson(gradPersonUrl($this->group, '100000001'), ['appointmentPercent' => null, 'hasFeeOffset' => true, 'isInternational' => false])->status())->toBe(403);
    });

    it('lets a courses editor save every override', function () {
        actingAs($this->coursesEditor);

        expect(patchJson(jobCodeRateOverrideUrl($this->group, 'TBA'), ['salary' => 1])->status())->toBe(200);
        expect(putJson(personRateOverrideUrl($this->group, '100000001'), ['salary' => 1])->status())->toBe(200);
        expect(putJson(personNoteUrl($this->group, '100000001'), ['notes' => 'x'])->status())->toBe(200);
        expect(patchJson(gradRateOverrideUrl($this->group), ['hourlyRate' => 1])->status())->toBe(200);
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

describe('grad rates in the payload', function () {
    beforeEach(function () {
        actingAs($this->groupManager);
    });

    it('reports a job code student status', function () {
        JobCode::factory()->create(['code' => '9519', 'student_status' => StudentStatus::Abd]);

        $rows = collect(getJson(costAssumptionsUrl($this->group))->json('jobCodes'))->keyBy('code');

        expect($rows['9519']['studentStatus'])->toBe('abd');
        expect($rows['TBA']['studentStatus'])->toBeNull();
    });

    it('reports no defaults and no levels for a term without grad rates', function () {
        $res = getJson(costAssumptionsUrl($this->group));

        expect($res->json('gradRates'))->toBe(['defaults' => null, 'levels' => []]);
        expect($res->json('rateOverrides.grad'))->toBeNull();
        expect($res->json('rateOverrides.gradHours'))->toBe([]);
        expect($res->json('gradPeople'))->toBe([]);
    });

    it('reports the inputs and levels of exactly the requested term, levels ordered by percent', function () {
        gradTermRateWithLevels(TERM_FALL_2026, [50 => 392, '12.5' => 98]);
        gradTermRateWithLevels(1273, [25 => 194]);

        $gradRates = getJson(costAssumptionsUrl($this->group))->json('gradRates');

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

    it('lists the department-term grad overrides, hours overrides, and grad people, and none from another department', function () {
        gradTermRateWithLevels();
        patchJson(gradRateOverrideUrl($this->group), ['hourlyRate' => 31]);
        putJson(gradHoursUrl($this->group, '25'), ['hours' => 200]);
        putJson(gradPersonUrl($this->group, '100000001'), ['appointmentPercent' => 50, 'hasFeeOffset' => true, 'isInternational' => false]);
        TermGradPerson::create(['academic_org' => COST_API_OTHER_DEPT, 'term_code' => TERM_FALL_2026, 'emplid' => 100000002, 'has_fee_offset' => true]);

        $res = getJson(costAssumptionsUrl($this->group));

        expect($res->json('rateOverrides.grad'))->toEqual([
            'hourlyRate' => 31.0,
            'healthRate' => null,
            'tuitionPerHourRegular' => null,
            'tuitionPerHourAbd' => null,
            'feeOffset' => null,
            'internationalOffset' => null,
            'perCreditPayment' => null,
            'defaultAppointmentPercent' => null,
        ]);
        expect($res->json('rateOverrides.gradHours'))->toEqual([['appointmentPercent' => 25.0, 'hours' => 200]]);
        expect($res->json('gradPeople'))->toEqual([
            ['emplid' => 100000001, 'appointmentPercent' => 50.0, 'hasFeeOffset' => true, 'isInternational' => false],
        ]);
        expect(getJson(costAssumptionsUrl($this->group, 1273))->json('rateOverrides.grad'))->toBeNull();
    });
});

describe('grad rate overrides', function () {
    beforeEach(function () {
        actingAs($this->groupManager);
    });

    it('saves a subset of inputs and responds with every input', function () {
        $res = patchJson(gradRateOverrideUrl($this->group), ['hourlyRate' => 31.5, 'healthRate' => 0.3]);

        expect($res->status())->toBe(200);
        expect($res->json('hourlyRate'))->toBe(31.5);
        expect($res->json('healthRate'))->toBe(0.3);
        expect($res->json('feeOffset'))->toBeNull();
        expect(TermGradRateOverride::count())->toBe(1);
    });

    it('leaves an input alone when its key is absent and clears it when null', function () {
        patchJson(gradRateOverrideUrl($this->group), ['hourlyRate' => 31, 'feeOffset' => 200]);

        $kept = patchJson(gradRateOverrideUrl($this->group), ['hourlyRate' => 32]);
        $cleared = patchJson(gradRateOverrideUrl($this->group), ['feeOffset' => null]);

        expect($kept->json('feeOffset'))->toEqual(200.0);
        expect($cleared->json('hourlyRate'))->toEqual(32.0);
        expect($cleared->json('feeOffset'))->toBeNull();
        expect(TermGradRateOverride::count())->toBe(1);
    });

    it('deletes the row when every input ends up null', function () {
        patchJson(gradRateOverrideUrl($this->group), ['hourlyRate' => 31]);

        $res = patchJson(gradRateOverrideUrl($this->group), ['hourlyRate' => null]);

        expect(array_filter($res->json(), fn($input) => $input !== null))->toBe([]);
        expect(TermGradRateOverride::count())->toBe(0);
    });

    it('saves a default appointment percent on its own and reports it in the payload', function () {
        gradTermRateWithLevels();

        $res = patchJson(gradRateOverrideUrl($this->group), ['defaultAppointmentPercent' => 50]);

        expect($res->status())->toBe(200);
        expect($res->json('defaultAppointmentPercent'))->toEqual(50.0);
        expect($res->json('hourlyRate'))->toBeNull();
        expect(getJson(costAssumptionsUrl($this->group))->json('rateOverrides.grad.defaultAppointmentPercent'))->toEqual(50.0);
    });

    it('keeps the default appointment percent when only a rate changes', function () {
        gradTermRateWithLevels();
        patchJson(gradRateOverrideUrl($this->group), ['defaultAppointmentPercent' => 25]);

        $res = patchJson(gradRateOverrideUrl($this->group), ['hourlyRate' => 31]);

        expect($res->json('defaultAppointmentPercent'))->toEqual(25.0);
    });

    it('rejects a default appointment percent that is not one of the term\'s levels', function () {
        gradTermRateWithLevels();

        expect(patchJson(gradRateOverrideUrl($this->group), ['defaultAppointmentPercent' => 30])->status())->toBe(422);
        expect(patchJson(gradRateOverrideUrl($this->group), ['defaultAppointmentPercent' => 'abc'])->status())->toBe(422);
        expect(TermGradRateOverride::count())->toBe(0);
    });

    it('deletes a row holding only a default appointment percent when it is set back to null', function () {
        gradTermRateWithLevels();
        patchJson(gradRateOverrideUrl($this->group), ['defaultAppointmentPercent' => 50]);

        $res = patchJson(gradRateOverrideUrl($this->group), ['defaultAppointmentPercent' => null]);

        expect($res->json('defaultAppointmentPercent'))->toBeNull();
        expect(TermGradRateOverride::count())->toBe(0);
    });

    it('records the acting user as creator and updater', function () {
        patchJson(gradRateOverrideUrl($this->group), ['hourlyRate' => 31]);

        expect(TermGradRateOverride::first()->created_by)->toBe($this->groupManager->id);
        expect(TermGradRateOverride::first()->updated_by)->toBe($this->groupManager->id);
    });

    it('rejects a body with no known key, a negative amount, and a health rate over 5', function () {
        expect(patchJson(gradRateOverrideUrl($this->group), [])->status())->toBe(422);
        expect(patchJson(gradRateOverrideUrl($this->group), ['unknown' => 1])->status())->toBe(422);
        expect(patchJson(gradRateOverrideUrl($this->group), ['hourlyRate' => -1])->status())->toBe(422);
        expect(patchJson(gradRateOverrideUrl($this->group), ['feeOffset' => 1.234])->status())->toBe(422);
        expect(patchJson(gradRateOverrideUrl($this->group), ['healthRate' => 5.1])->status())->toBe(422);
        expect(TermGradRateOverride::count())->toBe(0);
    });
});

describe('grad hours overrides', function () {
    beforeEach(function () {
        actingAs($this->groupManager);
        gradTermRateWithLevels();
    });

    it('saves the hours for a level of the term and lists them', function () {
        $res = putJson(gradHoursUrl($this->group, '25'), ['hours' => 200]);

        expect($res->json())->toEqual(['appointmentPercent' => 25.0, 'hours' => 200]);
        expect(TermGradHoursOverride::count())->toBe(1);
    });

    it('updates the same row and deletes it when hours is null', function () {
        putJson(gradHoursUrl($this->group, '25'), ['hours' => 200]);
        putJson(gradHoursUrl($this->group, '25'), ['hours' => 210]);
        expect(TermGradHoursOverride::count())->toBe(1);
        expect(TermGradHoursOverride::first()->hours)->toBe(210);

        $res = putJson(gradHoursUrl($this->group, '25'), ['hours' => null]);

        expect($res->json())->toEqual(['appointmentPercent' => 25.0, 'hours' => null]);
        expect(TermGradHoursOverride::count())->toBe(0);
    });

    it('returns 404 for a percent that is not a level of the term', function () {
        expect(putJson(gradHoursUrl($this->group, '30'), ['hours' => 200])->status())->toBe(404);
        expect(putJson(gradHoursUrl($this->group, 'abc'), ['hours' => 200])->status())->toBe(404);
    });

    it('returns 404 when the term has no grad rates', function () {
        GradTermRate::query()->delete();

        expect(putJson(gradHoursUrl($this->group, '25'), ['hours' => 200])->status())->toBe(404);
    });

    it('rejects fractional, negative, or over-2080 hours and a body that omits them', function () {
        expect(putJson(gradHoursUrl($this->group, '25'), ['hours' => 1.5])->status())->toBe(422);
        expect(putJson(gradHoursUrl($this->group, '25'), ['hours' => -1])->status())->toBe(422);
        expect(putJson(gradHoursUrl($this->group, '25'), ['hours' => 2081])->status())->toBe(422);
        expect(putJson(gradHoursUrl($this->group, '25'), [])->status())->toBe(422);
    });
});

describe('grad people', function () {
    beforeEach(function () {
        actingAs($this->groupManager);
        gradTermRateWithLevels();
    });

    it('saves an appointment and the two offset flags', function () {
        $body = ['appointmentPercent' => 50, 'hasFeeOffset' => true, 'isInternational' => true];

        $res = putJson(gradPersonUrl($this->group, '100000001'), $body);

        expect($res->json())->toEqual(['emplid' => 100000001, 'appointmentPercent' => 50.0, 'hasFeeOffset' => true, 'isInternational' => true]);
        expect(TermGradPerson::count())->toBe(1);
        expect(TermGradPerson::first()->created_by)->toBe($this->groupManager->id);
    });

    it('keeps a row for a null appointment when a flag is set, and updates it in place', function () {
        putJson(gradPersonUrl($this->group, '100000001'), ['appointmentPercent' => null, 'hasFeeOffset' => true, 'isInternational' => false]);
        putJson(gradPersonUrl($this->group, '100000001'), ['appointmentPercent' => null, 'hasFeeOffset' => false, 'isInternational' => true]);

        expect(TermGradPerson::count())->toBe(1);
        expect(TermGradPerson::first()->is_international)->toBeTrue();
        expect(TermGradPerson::first()->has_fee_offset)->toBeFalse();
    });

    it('deletes the row when the appointment is null and both flags are false', function () {
        putJson(gradPersonUrl($this->group, '100000001'), ['appointmentPercent' => 25, 'hasFeeOffset' => false, 'isInternational' => false]);

        putJson(gradPersonUrl($this->group, '100000001'), ['appointmentPercent' => null, 'hasFeeOffset' => false, 'isInternational' => false]);

        expect(TermGradPerson::count())->toBe(0);
    });

    it('rejects an appointment that is not a level of the term, missing fields, and non-boolean flags', function () {
        $valid = ['appointmentPercent' => 25, 'hasFeeOffset' => false, 'isInternational' => false];

        expect(putJson(gradPersonUrl($this->group, '100000001'), [...$valid, 'appointmentPercent' => 30])->status())->toBe(422);
        expect(putJson(gradPersonUrl($this->group, '100000001'), [...$valid, 'appointmentPercent' => 'abc'])->status())->toBe(422);
        expect(putJson(gradPersonUrl($this->group, '100000001'), ['appointmentPercent' => 25, 'hasFeeOffset' => false])->status())->toBe(422);
        expect(putJson(gradPersonUrl($this->group, '100000001'), [...$valid, 'isInternational' => 'maybe'])->status())->toBe(422);
        expect(TermGradPerson::count())->toBe(0);
    });

    it('returns 404 for an emplid that is not a positive whole number', function () {
        $body = ['appointmentPercent' => null, 'hasFeeOffset' => true, 'isInternational' => false];

        expect(putJson(gradPersonUrl($this->group, 'abc'), $body)->status())->toBe(404);
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

    it('refuses grad rate, grad hours, and grad person edits', function () {
        gradTermRateWithLevels();

        expect(patchJson(gradRateOverrideUrl($this->group), ['hourlyRate' => 31])->status())->toBe(403);
        expect(putJson(gradHoursUrl($this->group, '25'), ['hours' => 200])->status())->toBe(403);
        expect(putJson(gradPersonUrl($this->group, '100000001'), ['appointmentPercent' => 25, 'hasFeeOffset' => false, 'isInternational' => false])->status())->toBe(403);
        expect(TermGradRateOverride::count() + TermGradHoursOverride::count() + TermGradPerson::count())->toBe(0);
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
