<?php

namespace App\Http\Controllers\TermPlanning;

use App\Group;
use App\Http\Controllers\Controller;
use App\JobCode;
use App\Library\TermPlan\CostAssumptions;
use App\Library\TermPlan\TermCode;
use App\Library\TermPlan\TermLock;
use App\LocalCourse;
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
