<?php

namespace App\Http\Controllers\TermPlanning;

use App\Group;
use App\Http\Controllers\Controller;
use App\Library\TermPlan\CostAssumptions;
use App\Library\TermPlan\InstructorType;
use App\Library\TermPlan\StudentStatus;
use App\Library\TermPlan\TermCode;
use App\LocalCourse;
use App\TermCostPersonChoice;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CostPersonChoiceController extends Controller {
    public function update(Request $request, Group $group, int $emplid) {
        // No TermLock check. Planners override costs on
        // published terms, and the 'published terms' tests
        // in TermCostApiTest fail if a lock is added.
        $this->authorize('editAnyCoursesForGroup', [LocalCourse::class, $group]);

        $termCode = TermCode::fromRequest($request);
        abort_if($group->sis_dept_id === null, 404, 'This group has no department to estimate costs for.');
        $academicOrg = (int) $group->sis_dept_id;

        $validated = $request->validate([
            'jobCode' => ['present', 'nullable', 'string', Rule::in(CostAssumptions::jobCodesHeldBy($academicOrg, $emplid))],
            'instructorType' => ['present', 'nullable', Rule::enum(InstructorType::class)],
            'studentStatus' => ['present', 'nullable', Rule::enum(StudentStatus::class)],
            'overrideCost' => ['present', 'nullable', 'numeric', 'decimal:0,2', 'min:0', 'max:99999999.99'],
            'overrideReason' => ['present', 'nullable', 'string', 'max:1000'],
        ]);

        $uniqueKey = ['academic_org' => $academicOrg, 'term_code' => $termCode, 'emplid' => $emplid];
        $choiceColumns = [
            'job_code' => $validated['jobCode'],
            'instructor_type' => $validated['instructorType'],
            'student_status' => $validated['studentStatus'],
            'override_cost' => $validated['overrideCost'],
            'override_reason' => $validated['overrideReason'],
        ];
        $isEveryFieldCleared = collect($choiceColumns)->every(fn($value) => $value === null);

        if ($isEveryFieldCleared) {
            // A query delete() fires no model event, so
            // laravel-auditing would record no deletion.
            TermCostPersonChoice::where($uniqueKey)->first()?->delete();

            return CostAssumptions::describePersonChoice(new TermCostPersonChoice($uniqueKey));
        }

        $personChoice = TermCostPersonChoice::createOrFirst($uniqueKey, [
            ...$choiceColumns,
            'created_by' => auth()->id(),
            'updated_by' => auth()->id(),
        ]);

        if (!$personChoice->wasRecentlyCreated) {
            $personChoice->update([...$choiceColumns, 'updated_by' => auth()->id()]);
        }

        return CostAssumptions::describePersonChoice($personChoice);
    }
}
