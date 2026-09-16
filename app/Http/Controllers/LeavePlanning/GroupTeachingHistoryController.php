<?php

namespace App\Http\Controllers\LeavePlanning;

use App\Course;
use App\Group;
use App\Http\Controllers\Controller;
use App\Library\LeavePlanning\PlanningPeople;
use App\Library\LeavePlanning\TeachingHistory;
use App\SisAppointment;
use Illuminate\Http\Request;

class GroupTeachingHistoryController extends Controller {
    public function index(Request $request, Group $group) {
        $this->authorize('viewAnyCoursesForGroup', [Course::class, $group]);

        $validated = $request->validate([
            'start' => 'required|integer',
            'end' => 'required|integer|gte:start',
        ]);

        $deptId = $group->sis_dept_id;

        if ($deptId === null) {
            return ['people' => [], 'sections' => []];
        }

        $sections = TeachingHistory::sectionsBetween((int) $deptId, $validated['start'], $validated['end']);

        $appointedEmplids = SisAppointment::where('dept_id', $deptId)->pluck('emplid');
        $instructorEmplids = $sections->pluck('instructors')->flatten(1)->pluck('emplid');

        return [
            'people' => PlanningPeople::forEmplids($deptId, $appointedEmplids->concat($instructorEmplids)),
            'sections' => $sections,
        ];
    }
}
