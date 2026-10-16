<?php

namespace App\Http\Controllers\TermPlanning;

use App\Group;
use App\Http\Controllers\Controller;
use App\Library\TermPlan\CostAssumptions;
use App\Library\TermPlan\TermCode;
use App\LocalCourse;
use Illuminate\Http\Request;

class CostAssumptionController extends Controller {
    public function index(Request $request, Group $group) {
        $this->authorize('viewAnyCoursesForGroup', [LocalCourse::class, $group]);

        $termCode = TermCode::fromRequest($request);
        abort_if($group->sis_dept_id === null, 404, 'This group has no department to estimate costs for.');

        return [
            ...CostAssumptions::forTerm((int) $group->sis_dept_id, $termCode),
            'canEdit' => $request->user()->can('editAnyCoursesForGroup', [LocalCourse::class, $group]),
        ];
    }
}
