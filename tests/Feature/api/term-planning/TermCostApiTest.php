<?php

use App\Constants\Permissions;
use App\Group;
use App\JobCode;
use App\JobCodeRate;
use App\Library\TermPlan\InstructorType;
use App\Library\TermPlan\Season;
use App\Membership;
use App\SisAppointment;
use App\SisClassInstructor;
use App\SisClassMeeting;
use App\SisClassSection;
use App\SisDepartment;
use App\SisEmployee;
use App\TaAppointmentRate;
use App\TermCostPersonChoice;
use App\TermCostSetting;
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

function costSettingUrl(Group $group, string $key, int $term = TERM_FALL_2026): string {
    return "/api/term-planning/groups/{$group->id}/cost-settings/{$key}?term={$term}";
}

function personChoiceUrl(Group $group, int $emplid, int $term = TERM_FALL_2026): string {
    return "/api/term-planning/groups/{$group->id}/cost-person-choices/{$emplid}?term={$term}";
}

function enrollmentHistoryUrl(Group $group, int $term = TERM_FALL_2026): string {
    return "/api/term-planning/groups/{$group->id}/enrollment-history?term={$term}";
}

function effectiveSetting(Group $group, string $key, int $term = TERM_FALL_2026): array {
    $settings = getJson(costAssumptionsUrl($group, $term))->json('settings');

    return collect($settings)->firstWhere('key', $key);
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

function personChoicePayload(array $overrides = []): array {
    return [
        'jobCode' => '9401',
        'instructorType' => 'pa_instructor',
        'studentStatus' => 'abd',
        'overrideCost' => 5000.5,
        'overrideReason' => 'Buyout',
        ...$overrides,
    ];
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
    it('refuses a courses viewer saving a setting', function () {
        actingAs($this->coursesViewer);

        expect(putJson(costSettingUrl($this->group, 'unstaffedSectionCost'), ['value' => 1])->status())->toBe(403);
    });

    it('lets a courses editor save a setting', function () {
        actingAs($this->coursesEditor);

        expect(putJson(costSettingUrl($this->group, 'unstaffedSectionCost'), ['value' => 1])->status())->toBe(200);
    });

    it('refuses a courses viewer saving a person choice', function () {
        $employee = appointedEmployee('9401');

        actingAs($this->coursesViewer);

        expect(putJson(personChoiceUrl($this->group, $employee->emplid), personChoicePayload())->status())->toBe(403);
    });

    it('lets a courses editor save a person choice', function () {
        $employee = appointedEmployee('9401');

        actingAs($this->coursesEditor);

        expect(putJson(personChoiceUrl($this->group, $employee->emplid), personChoicePayload())->status())->toBe(200);
    });
});

describe('job code rates', function () {
    beforeEach(function () {
        actingAs($this->groupManager);
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

describe('settings', function () {
    beforeEach(function () {
        actingAs($this->groupManager);
    });

    it('lists every setting at its default when nothing is saved', function () {
        $settings = getJson(costAssumptionsUrl($this->group))->json('settings');
        $annualLoadKeys = array_map(fn(InstructorType $type) => "annualLoad.{$type->value}", InstructorType::cases());

        expect(collect($settings)->pluck('key')->all())->toEqualCanonicalizing([
            'unstaffedSectionCost',
            'unratedJobCodeCost',
            'taAppointmentPercent',
            'isRecurringBudgetFree',
            ...$annualLoadKeys,
        ]);
        foreach ($settings as $setting) {
            expect($setting['value'])->toBe($setting['default']);
            expect($setting['valueFiscalYear'])->toBeNull();
        }
    });

    it('carries a saved value forward to later fiscal years', function () {
        putJson(costSettingUrl($this->group, 'unstaffedSectionCost', TERM_SPRING_2026), ['value' => 12000]);

        $setting = effectiveSetting($this->group, 'unstaffedSectionCost');

        expect($setting['value'])->toBe(12000);
        expect($setting['valueFiscalYear'])->toBe(2026);
    });

    it('prefers a value saved in the term fiscal year over an earlier one', function () {
        putJson(costSettingUrl($this->group, 'unstaffedSectionCost', TERM_SPRING_2026), ['value' => 12000]);
        putJson(costSettingUrl($this->group, 'unstaffedSectionCost'), ['value' => 13000]);

        $setting = effectiveSetting($this->group, 'unstaffedSectionCost');

        expect($setting['value'])->toBe(13000);
        expect($setting['valueFiscalYear'])->toBe(2027);
    });

    it('falls back to the earlier fiscal year when the term fiscal year is cleared with null', function () {
        putJson(costSettingUrl($this->group, 'unstaffedSectionCost', TERM_SPRING_2026), ['value' => 12000]);
        putJson(costSettingUrl($this->group, 'unstaffedSectionCost'), ['value' => 13000]);
        putJson(costSettingUrl($this->group, 'unstaffedSectionCost'), ['value' => null]);

        $setting = effectiveSetting($this->group, 'unstaffedSectionCost');

        expect($setting['value'])->toBe(12000);
        expect($setting['valueFiscalYear'])->toBe(2026);
    });

    it('round-trips a false toggle as boolean false', function () {
        putJson(costSettingUrl($this->group, 'isRecurringBudgetFree'), ['value' => false]);

        $setting = effectiveSetting($this->group, 'isRecurringBudgetFree');

        expect($setting['value'])->toBeFalse();
        expect($setting['valueFiscalYear'])->toBe(2027);
    });

    it('reports each setting with the fiscal year its own value was saved in', function () {
        putJson(costSettingUrl($this->group, 'unstaffedSectionCost', TERM_SPRING_2026), ['value' => 12000]);
        putJson(costSettingUrl($this->group, 'unratedJobCodeCost'), ['value' => 13000]);

        expect(effectiveSetting($this->group, 'unstaffedSectionCost')['valueFiscalYear'])->toBe(2026);
        expect(effectiveSetting($this->group, 'unratedJobCodeCost')['valueFiscalYear'])->toBe(2027);
    });

    it('ignores a value saved for a later fiscal year', function () {
        putJson(costSettingUrl($this->group, 'unstaffedSectionCost', 1279), ['value' => 14000]);

        $setting = effectiveSetting($this->group, 'unstaffedSectionCost');

        expect($setting['value'])->toBe($setting['default']);
        expect($setting['valueFiscalYear'])->toBeNull();
    });

    it('saves the same new setting twice without error or a duplicate row', function () {
        $first = putJson(costSettingUrl($this->group, 'unstaffedSectionCost'), ['value' => 100]);
        $second = putJson(costSettingUrl($this->group, 'unstaffedSectionCost'), ['value' => 200]);

        expect($first->status())->toBe(200);
        expect($second->status())->toBe(200);
        expect(effectiveSetting($this->group, 'unstaffedSectionCost')['value'])->toBe(200);
        expect(TermCostSetting::where(['key' => 'unstaffedSectionCost', 'fiscal_year' => 2027])->count())->toBe(1);
    });

    it('rejects an appointment percent of zero', function () {
        expect(putJson(costSettingUrl($this->group, 'taAppointmentPercent'), ['value' => 0])->status())->toBe(422);
    });

    it('rejects an appointment percent over 100', function () {
        expect(putJson(costSettingUrl($this->group, 'taAppointmentPercent'), ['value' => 150])->status())->toBe(422);
    });

    it('rejects a fractional annual load', function () {
        expect(putJson(costSettingUrl($this->group, 'annualLoad.pa_instructor'), ['value' => 2.5])->status())->toBe(422);
    });

    it('rejects a money value with more than two decimals', function () {
        expect(putJson(costSettingUrl($this->group, 'unstaffedSectionCost'), ['value' => 12.345])->status())->toBe(422);
    });

    it('returns 404 for an unknown setting key', function () {
        expect(putJson(costSettingUrl($this->group, 'bogus'), ['value' => 1])->status())->toBe(404);
    });

    it('responds with the effective setting', function () {
        $res = putJson(costSettingUrl($this->group, 'unstaffedSectionCost'), ['value' => 13000]);

        expect($res->json())->toMatchArray([
            'key' => 'unstaffedSectionCost',
            'value' => 13000.0,
            'valueFiscalYear' => 2027,
        ]);
    });

    it('ignores a setting saved by another department', function () {
        TermCostSetting::create([
            'academic_org' => COST_API_OTHER_DEPT,
            'fiscal_year' => 2027,
            'key' => 'unstaffedSectionCost',
            'value' => 99999,
        ]);

        $setting = effectiveSetting($this->group, 'unstaffedSectionCost');

        expect($setting['value'])->toBe($setting['default']);
        expect($setting['valueFiscalYear'])->toBeNull();
    });
});

describe('people and person choices', function () {
    beforeEach(function () {
        actingAs($this->groupManager);
    });

    it('lists each person of the department with distinct, trimmed, sorted job codes', function () {
        $employee = appointedEmployee('9402 ');
        SisAppointment::factory()->create(['emplid' => $employee->emplid, 'dept_id' => (string) COST_API_DEPT, 'job_code' => '9401', 'job_indicator' => 'P']);
        SisAppointment::factory()->create(['emplid' => $employee->emplid, 'dept_id' => (string) COST_API_DEPT, 'job_code' => '9402', 'job_indicator' => 'S']);

        $people = getJson(costAssumptionsUrl($this->group))->json('people');

        expect($people)->toBe([['emplid' => $employee->emplid, 'jobCodes' => ['9401', '9402']]]);
    });

    it('leaves out a person appointed only in another department', function () {
        appointedEmployee('9401', COST_API_OTHER_DEPT);

        expect(getJson(costAssumptionsUrl($this->group))->json('people'))->toBe([]);
    });

    it('saves a person choice and shows it in personChoices', function () {
        $employee = appointedEmployee('9401');

        $res = putJson(personChoiceUrl($this->group, $employee->emplid), personChoicePayload());

        $expected = [
            'emplid' => $employee->emplid,
            'jobCode' => '9401',
            'instructorType' => 'pa_instructor',
            'studentStatus' => 'abd',
            'overrideCost' => 5000.5,
            'overrideReason' => 'Buyout',
        ];
        expect($res->json())->toBe($expected);
        expect(getJson(costAssumptionsUrl($this->group))->json('personChoices'))->toBe([$expected]);
    });

    it('shows a person choice only for the term it was saved for', function () {
        $employee = appointedEmployee('9401');
        putJson(personChoiceUrl($this->group, $employee->emplid, TERM_SPRING_2026), personChoicePayload());

        expect(getJson(costAssumptionsUrl($this->group))->json('personChoices'))->toBe([]);
    });

    it('saves a choice without a job code for a person not appointed in the department', function () {
        $emplid = 100000001;
        $payload = personChoicePayload(['jobCode' => null]);

        $res = putJson(personChoiceUrl($this->group, $emplid), $payload);

        expect($res->status())->toBe(200);
        expect(getJson(costAssumptionsUrl($this->group))->json('personChoices.0.emplid'))->toBe($emplid);
    });

    it('returns 404 for an emplid of more than nine digits', function () {
        $res = putJson(personChoiceUrl($this->group, 12345678901), personChoicePayload(['jobCode' => null]));

        expect($res->status())->toBe(404);
    });

    it('rejects a job code the person does not hold in the department', function () {
        $employee = appointedEmployee('9401');

        $res = putJson(personChoiceUrl($this->group, $employee->emplid), personChoicePayload(['jobCode' => '9999']));

        expect($res->status())->toBe(422);
    });

    it('rejects an unknown instructor type', function () {
        $employee = appointedEmployee('9401');

        $res = putJson(personChoiceUrl($this->group, $employee->emplid), personChoicePayload(['instructorType' => 'bogus']));

        expect($res->status())->toBe(422);
    });

    it('rejects a body that omits a field', function () {
        $employee = appointedEmployee('9401');
        $payload = personChoicePayload();
        unset($payload['overrideReason']);

        expect(putJson(personChoiceUrl($this->group, $employee->emplid), $payload)->status())->toBe(422);
    });

    it('deletes the row when all five fields are null', function () {
        $employee = appointedEmployee('9401');
        putJson(personChoiceUrl($this->group, $employee->emplid), personChoicePayload());

        $res = putJson(personChoiceUrl($this->group, $employee->emplid), [
            'jobCode' => null,
            'instructorType' => null,
            'studentStatus' => null,
            'overrideCost' => null,
            'overrideReason' => null,
        ]);

        expect($res->json())->toBe([
            'emplid' => $employee->emplid,
            'jobCode' => null,
            'instructorType' => null,
            'studentStatus' => null,
            'overrideCost' => null,
            'overrideReason' => null,
        ]);
        expect(getJson(costAssumptionsUrl($this->group))->json('personChoices'))->toBe([]);
    });

    it('records the acting user as creator and updater of a new choice', function () {
        $employee = appointedEmployee('9401');

        putJson(personChoiceUrl($this->group, $employee->emplid), personChoicePayload());

        $saved = TermCostPersonChoice::where('emplid', $employee->emplid)->first();
        expect($saved->created_by)->toBe($this->groupManager->id);
        expect($saved->updated_by)->toBe($this->groupManager->id);
    });
});

describe('published terms', function () {
    beforeEach(function () {
        SisClassSection::factory()->create(['academic_org' => COST_API_DEPT, 'term_code' => TERM_FALL_2026]);
        actingAs($this->coursesEditor);
    });

    it('still accepts a person choice', function () {
        $employee = appointedEmployee('9401');

        expect(putJson(personChoiceUrl($this->group, $employee->emplid), personChoicePayload())->status())->toBe(200);
    });

    it('still accepts a setting', function () {
        expect(putJson(costSettingUrl($this->group, 'unstaffedSectionCost'), ['value' => 13000])->status())->toBe(200);
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
