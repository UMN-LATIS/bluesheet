<?php

namespace App\Http\Controllers\TermPlanning;

use App\Group;
use App\Http\Controllers\Controller;
use App\Library\TermPlan\EnrollmentHistory;
use App\Library\TermPlan\TermCode;
use App\LocalCourse;
use Illuminate\Http\Request;

class EnrollmentHistoryController extends Controller {
    public function index(Request $request, Group $group) {
        $this->authorize('viewAnyCoursesForGroup', [LocalCourse::class, $group]);

        $termCode = TermCode::fromRequest($request);

        if ($group->sis_dept_id === null) {
            return ['termCodes' => [], 'sections' => []];
        }

        return EnrollmentHistory::before((int) $group->sis_dept_id, $termCode);
    }
}
