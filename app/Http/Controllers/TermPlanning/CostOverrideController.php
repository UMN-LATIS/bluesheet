<?php

namespace App\Http\Controllers\TermPlanning;

use App\GradTermRate;
use App\Group;
use App\Http\Controllers\Controller;
use App\JobCode;
use App\Library\TermPlan\CostAssumptions;
use App\Library\TermPlan\GradRateInputs;
use App\Library\TermPlan\TermCode;
use App\Library\TermPlan\TermLock;
use App\LocalCourse;
use App\TermGradHoursOverride;
use App\TermGradPerson;
use App\TermGradRateOverride;
use App\TermJobCodeRateOverride;
use App\TermPersonNote;
use App\TermPersonRateOverride;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CostOverrideController extends Controller {
    private const MONEY_RULES = ['numeric', 'decimal:0,2', 'min:0', 'max:99999999.99'];

    public function updateJobCodeRate(Request $request, Group $group, string $jobCode) {
        $academicOrg = $this->authorizeAndFindAcademicOrg($group);
        $termCode = TermCode::fromRequest($request);
        $this->abortIfTermIsReadOnly($academicOrg, $termCode);
        abort_unless(
            $this->isKnownJobCode($jobCode, $academicOrg),
            404,
            "No job code {$jobCode} is known to this department.",
        );

        if (!$request->hasAny(['salary', 'fringeRate'])) {
            throw ValidationException::withMessages(['salary' => 'Send a salary, a fringeRate, or both.']);
        }

        $changes = $request->validate([
            'salary' => ['sometimes', 'nullable', ...self::MONEY_RULES],
            'fringeRate' => ['sometimes', 'nullable', 'numeric', 'decimal:0,4', 'min:0', 'max:5'],
        ]);

        $uniqueKey = ['academic_org' => $academicOrg, 'term_code' => $termCode, 'job_code' => $jobCode];
        $saved = TermJobCodeRateOverride::where($uniqueKey)->first();
        $salary = array_key_exists('salary', $changes) ? $changes['salary'] : $saved?->salary;
        $fringeRate = array_key_exists('fringeRate', $changes) ? $changes['fringeRate'] : $saved?->fringe_rate;
        $salary = $salary === null ? null : (float) $salary;
        $fringeRate = $fringeRate === null ? null : (float) $fringeRate;

        $this->saveOrDelete(
            TermJobCodeRateOverride::class,
            $uniqueKey,
            $salary === null && $fringeRate === null ? null : ['salary' => $salary, 'fringe_rate' => $fringeRate],
        );

        return ['jobCode' => $jobCode, 'salary' => $salary, 'fringeRate' => $fringeRate];
    }

    public function updatePersonRate(Request $request, Group $group, string $emplid) {
        $academicOrg = $this->authorizeAndFindAcademicOrg($group);
        $termCode = TermCode::fromRequest($request);
        $this->abortIfTermIsReadOnly($academicOrg, $termCode);
        $emplid = $this->emplidOrNotFound($emplid);

        $validated = $request->validate([
            'salary' => ['present', 'nullable', ...self::MONEY_RULES],
        ])['salary'];
        $salary = $validated === null ? null : (float) $validated;

        $this->saveOrDelete(
            TermPersonRateOverride::class,
            ['academic_org' => $academicOrg, 'term_code' => $termCode, 'emplid' => $emplid],
            $salary === null ? null : ['salary' => $salary],
        );

        return ['emplid' => $emplid, 'salary' => $salary];
    }

    public function updateGradRates(Request $request, Group $group) {
        $academicOrg = $this->authorizeAndFindAcademicOrg($group);
        $termCode = TermCode::fromRequest($request);
        $this->abortIfTermIsReadOnly($academicOrg, $termCode);

        if (!$request->hasAny([...array_keys(GradRateInputs::COLUMN_BY_KEY), 'defaultAppointmentPercent'])) {
            throw ValidationException::withMessages(['hourlyRate' => 'Send at least one grad rate.']);
        }

        $levelPercents = $this->gradLevelPercents($termCode);

        $changes = $request->validate([
            'hourlyRate' => ['sometimes', 'nullable', ...self::MONEY_RULES],
            'healthRate' => ['sometimes', 'nullable', 'numeric', 'decimal:0,4', 'min:0', 'max:5'],
            'tuitionPerHourRegular' => ['sometimes', 'nullable', ...self::MONEY_RULES],
            'tuitionPerHourAbd' => ['sometimes', 'nullable', ...self::MONEY_RULES],
            'feeOffset' => ['sometimes', 'nullable', ...self::MONEY_RULES],
            'internationalOffset' => ['sometimes', 'nullable', ...self::MONEY_RULES],
            'perCreditPayment' => ['sometimes', 'nullable', ...self::MONEY_RULES],
            'defaultAppointmentPercent' => [
                'sometimes',
                'nullable',
                'numeric',
                fn(string $attribute, mixed $percent, \Closure $fail) => in_array((float) $percent, $levelPercents, true)
                    || $fail('The default appointment percent must be one of the term\'s appointment levels.'),
            ],
        ]);

        $uniqueKey = ['academic_org' => $academicOrg, 'term_code' => $termCode];
        $saved = TermGradRateOverride::where($uniqueKey)->first();
        $inputs = [
            ...($saved === null ? array_fill_keys(array_keys(GradRateInputs::COLUMN_BY_KEY), null) : GradRateInputs::fromRow($saved)),
            'defaultAppointmentPercent' => $saved?->default_appointment_percent,
        ];
        foreach ($changes as $key => $value) {
            $inputs[$key] = $value === null ? null : (float) $value;
        }

        $values = [];
        foreach (GradRateInputs::COLUMN_BY_KEY as $key => $column) {
            $values[$column] = $inputs[$key];
        }
        $values['default_appointment_percent'] = $inputs['defaultAppointmentPercent'];
        $isEveryInputNull = count(array_filter($inputs, fn($input) => $input !== null)) === 0;

        $this->saveOrDelete(TermGradRateOverride::class, $uniqueKey, $isEveryInputNull ? null : $values);

        return $inputs;
    }

    public function updateGradHours(Request $request, Group $group, string $appointmentPercent) {
        $academicOrg = $this->authorizeAndFindAcademicOrg($group);
        $termCode = TermCode::fromRequest($request);
        $this->abortIfTermIsReadOnly($academicOrg, $termCode);
        abort_unless(
            is_numeric($appointmentPercent) && in_array((float) $appointmentPercent, $this->gradLevelPercents($termCode), true),
            404,
            "No appointment level {$appointmentPercent} is set for this term.",
        );
        $appointmentPercent = (float) $appointmentPercent;

        $hours = $request->validate([
            'hours' => ['present', 'nullable', 'integer', 'min:0', 'max:2080'],
        ])['hours'];
        $hours = $hours === null ? null : (int) $hours;

        $this->saveOrDelete(
            TermGradHoursOverride::class,
            ['academic_org' => $academicOrg, 'term_code' => $termCode, 'appointment_percent' => $appointmentPercent],
            $hours === null ? null : ['hours' => $hours],
        );

        return ['appointmentPercent' => $appointmentPercent, 'hours' => $hours];
    }

    public function updateGradPerson(Request $request, Group $group, string $emplid) {
        $academicOrg = $this->authorizeAndFindAcademicOrg($group);
        $termCode = TermCode::fromRequest($request);
        $this->abortIfTermIsReadOnly($academicOrg, $termCode);
        $emplid = $this->emplidOrNotFound($emplid);

        $validated = $request->validate([
            'hasFeeOffset' => ['present', 'boolean'],
            'isInternational' => ['present', 'boolean'],
        ]);
        $hasFeeOffset = (bool) $validated['hasFeeOffset'];
        $isInternational = (bool) $validated['isInternational'];
        $isDefault = !$hasFeeOffset && !$isInternational;

        $this->saveOrDelete(
            TermGradPerson::class,
            ['academic_org' => $academicOrg, 'term_code' => $termCode, 'emplid' => $emplid],
            $isDefault ? null : [
                'has_fee_offset' => $hasFeeOffset,
                'is_international' => $isInternational,
            ],
        );

        return [
            'emplid' => $emplid,
            'hasFeeOffset' => $hasFeeOffset,
            'isInternational' => $isInternational,
        ];
    }

    public function updatePersonNote(Request $request, Group $group, string $emplid) {
        $academicOrg = $this->authorizeAndFindAcademicOrg($group);
        $termCode = TermCode::fromRequest($request);
        $this->abortIfTermIsReadOnly($academicOrg, $termCode);
        $emplid = $this->emplidOrNotFound($emplid);

        $validated = $request->validate([
            'notes' => ['present', 'nullable', 'string', 'max:2000'],
        ])['notes'];
        $notes = $validated === null || trim($validated) === '' ? null : trim($validated);

        $this->saveOrDelete(
            TermPersonNote::class,
            ['academic_org' => $academicOrg, 'term_code' => $termCode, 'emplid' => $emplid],
            $notes === null ? null : ['notes' => $notes],
        );

        return ['emplid' => $emplid, 'notes' => $notes];
    }

    private function abortIfTermIsReadOnly(int $academicOrg, int $termCode): void {
        abort_if(
            TermLock::isReadOnly($academicOrg, $termCode),
            403,
            'The SIS has published this term, so it can no longer be planned here.'
        );
    }

    /** @return array<int, float> empty when the term has no grad rates */
    private function gradLevelPercents(int $termCode): array {
        $gradRate = GradTermRate::with('levels')->where('term_code', $termCode)->first();

        return $gradRate === null ? [] : $gradRate->levels->pluck('appointment_percent')->all();
    }

    private function emplidOrNotFound(string $emplid): int {
        abort_unless(ctype_digit($emplid) && (int) $emplid > 0 && strlen($emplid) <= 9, 404, 'An emplid is a positive whole number of at most nine digits.');

        return (int) $emplid;
    }

    private function authorizeAndFindAcademicOrg(Group $group): int {
        $this->authorize('editAnyCoursesForGroup', [LocalCourse::class, $group]);
        abort_if($group->sis_dept_id === null, 404, 'This group has no department to estimate costs for.');

        return (int) $group->sis_dept_id;
    }

    private function isKnownJobCode(string $jobCode, int $academicOrg): bool {
        return $jobCode === JobCode::UNSTAFFED_CODE
            || JobCode::where('code', $jobCode)->exists()
            || in_array($jobCode, CostAssumptions::jobCodesHeldInDepartment($academicOrg), true);
    }

    /**
     * A null `$values` deletes the row.
     *
     * @param class-string<Model> $overrideClass
     * @param array<string, mixed> $uniqueKey
     * @param array<string, mixed>|null $values
     */
    private function saveOrDelete(string $overrideClass, array $uniqueKey, ?array $values): void {
        if ($values === null) {
            // A query delete() fires no model event, so
            // laravel-auditing would record no deletion.
            $overrideClass::where($uniqueKey)->first()?->delete();

            return;
        }

        $override = $overrideClass::createOrFirst($uniqueKey, [
            ...$values,
            'created_by' => auth()->id(),
            'updated_by' => auth()->id(),
        ]);

        if (!$override->wasRecentlyCreated) {
            $override->update([...$values, 'updated_by' => auth()->id()]);
        }
    }
}
