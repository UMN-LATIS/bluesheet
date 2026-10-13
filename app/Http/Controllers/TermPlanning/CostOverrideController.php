<?php

namespace App\Http\Controllers\TermPlanning;

use App\Group;
use App\Http\Controllers\Controller;
use App\JobCode;
use App\Library\TermPlan\CostAssumptions;
use App\Library\TermPlan\StudentStatus;
use App\Library\TermPlan\TermCode;
use App\LocalClassSection;
use App\LocalCourse;
use App\SisClassSection;
use App\TermCostLineOverride;
use App\TermJobCodeRateOverride;
use App\TermTaRateOverride;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

// No TermLock check in any action. Planners override costs on
// published terms, and the 'published terms' tests in
// TermCostApiTest fail if a lock is added.
class CostOverrideController extends Controller {
    private const MONEY_RULES = ['numeric', 'decimal:0,2', 'min:0', 'max:99999999.99'];

    public function updateJobCodeRate(Request $request, Group $group, string $jobCode) {
        $academicOrg = $this->authorizedAcademicOrg($group);
        $termCode = TermCode::fromRequest($request);
        abort_unless(
            $this->isKnownJobCode($jobCode, $academicOrg),
            404,
            "No job code {$jobCode} is known to this department.",
        );

        $costPerCourse = $request->validate([
            'costPerCourse' => ['present', 'nullable', ...self::MONEY_RULES],
        ])['costPerCourse'];

        $this->saveOrDelete(
            TermJobCodeRateOverride::class,
            ['academic_org' => $academicOrg, 'term_code' => $termCode, 'job_code' => $jobCode],
            $costPerCourse === null ? null : ['cost_per_course' => (float) $costPerCourse],
        );

        return ['jobCode' => $jobCode, 'costPerCourse' => $costPerCourse === null ? null : (float) $costPerCourse];
    }

    public function updateTaAppointmentRate(Request $request, Group $group, string $appointmentPercent, string $studentStatus) {
        $academicOrg = $this->authorizedAcademicOrg($group);
        $termCode = TermCode::fromRequest($request);
        $status = StudentStatus::tryFrom($studentStatus) ?? abort(404, "No student status is named {$studentStatus}.");
        $percent = (float) $appointmentPercent;
        abort_unless($percent > 0 && $percent <= 100, 404, 'An appointment percent is above 0 and at most 100.');

        $costPerTerm = $request->validate([
            'costPerTerm' => ['present', 'nullable', ...self::MONEY_RULES],
        ])['costPerTerm'];

        $this->saveOrDelete(
            TermTaRateOverride::class,
            ['academic_org' => $academicOrg, 'term_code' => $termCode, 'appointment_percent' => $percent, 'student_status' => $status],
            $costPerTerm === null ? null : ['cost_per_term' => (float) $costPerTerm],
        );

        return ['appointmentPercent' => $percent, 'studentStatus' => $status->value, 'costPerTerm' => $costPerTerm === null ? null : (float) $costPerTerm];
    }

    public function updateLine(Request $request, Group $group) {
        $academicOrg = $this->authorizedAcademicOrg($group);
        $termCode = TermCode::fromRequest($request);

        $validated = $request->validate([
            'courseCode' => ['required', 'string', 'max:255'],
            'section' => ['required', 'string', 'max:255'],
            'emplid' => ['required', 'integer', 'min:1', 'max:999999999'],
            'amount' => ['present', 'nullable', ...self::MONEY_RULES],
            'reason' => ['present', 'nullable', 'string', 'max:1000'],
        ]);
        abort_unless(
            $this->isSectionOfDepartmentTerm($academicOrg, $termCode, $validated['courseCode'], $validated['section']),
            404,
            'No such section in this department and term.',
        );

        $amount = $validated['amount'] === null ? null : (float) $validated['amount'];
        $reason = $amount === null ? null : $validated['reason'];

        $this->saveOrDelete(
            TermCostLineOverride::class,
            [
                'academic_org' => $academicOrg,
                'term_code' => $termCode,
                'course_code' => $validated['courseCode'],
                'class_section' => $validated['section'],
                'emplid' => $validated['emplid'],
            ],
            $amount === null ? null : ['amount' => $amount, 'reason' => $reason],
        );

        return [
            'courseCode' => $validated['courseCode'],
            'section' => $validated['section'],
            'emplid' => $validated['emplid'],
            'amount' => $amount,
            'reason' => $reason,
        ];
    }

    private function authorizedAcademicOrg(Group $group): int {
        $this->authorize('editAnyCoursesForGroup', [LocalCourse::class, $group]);
        abort_if($group->sis_dept_id === null, 404, 'This group has no department to estimate costs for.');

        return (int) $group->sis_dept_id;
    }

    private function isSectionOfDepartmentTerm(int $academicOrg, int $termCode, string $courseCode, string $classSection): bool {
        $sectionKey = ['course_code' => $courseCode, 'class_section' => $classSection];

        return LocalClassSection::forDepartmentTerm($academicOrg, $termCode)->where($sectionKey)->exists()
            || SisClassSection::forDepartmentTerm($academicOrg, $termCode)->where($sectionKey)->exists();
    }

    private function isKnownJobCode(string $jobCode, int $academicOrg): bool {
        return $jobCode === JobCode::UNSTAFFED_CODE
            || JobCode::where('code', $jobCode)->exists()
            || in_array($jobCode, CostAssumptions::jobCodesHeldInDepartment($academicOrg), true);
    }

    /**
     * @param class-string<Model> $overrideClass
     * @param array<string, mixed> $uniqueKey
     * @param array<string, mixed>|null $values null deletes the row
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
