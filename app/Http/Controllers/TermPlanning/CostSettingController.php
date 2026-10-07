<?php

namespace App\Http\Controllers\TermPlanning;

use App\Group;
use App\Http\Controllers\Controller;
use App\Library\TermPlan\CostAssumptions;
use App\Library\TermPlan\CostSettings;
use App\Library\TermPlan\FiscalYear;
use App\Library\TermPlan\TermCode;
use App\LocalCourse;
use App\TermCostSetting;
use Illuminate\Http\Request;

class CostSettingController extends Controller {
    public function update(Request $request, Group $group, string $key) {
        // No TermLock check. Planners tune settings on
        // published terms, and the 'published terms' tests
        // in TermCostApiTest fail if a lock is added.
        $this->authorize('editAnyCoursesForGroup', [LocalCourse::class, $group]);

        $termCode = TermCode::fromRequest($request);
        abort_if($group->sis_dept_id === null, 404, 'This group has no department to estimate costs for.');
        $definition = CostSettings::all()[$key] ?? abort(404, "No cost setting is named {$key}.");

        $value = $request->validate([
            'value' => ['present', 'nullable', ...$definition->type->rules()],
        ])['value'];

        $academicOrg = (int) $group->sis_dept_id;
        $fiscalYear = FiscalYear::ofTerm($termCode);
        $uniqueKey = ['academic_org' => $academicOrg, 'fiscal_year' => $fiscalYear, 'key' => $definition->key];

        if ($value === null) {
            // A query delete() fires no model event, so
            // laravel-auditing would record no deletion.
            TermCostSetting::where($uniqueKey)->first()?->delete();
        } else {
            $departmentValue = TermCostSetting::createOrFirst($uniqueKey, [
                'value' => (float) $value,
                'created_by' => auth()->id(),
                'updated_by' => auth()->id(),
            ]);

            if (!$departmentValue->wasRecentlyCreated) {
                $departmentValue->update(['value' => (float) $value, 'updated_by' => auth()->id()]);
            }
        }

        return CostAssumptions::setting($academicOrg, $fiscalYear, $definition);
    }
}
