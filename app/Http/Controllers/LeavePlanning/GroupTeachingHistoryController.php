<?php

namespace App\Http\Controllers\LeavePlanning;

use App\Group;
use App\Http\Controllers\Controller;
use App\Library\LeavePlanning\PlanningPeople;
use App\Library\LeavePlanning\TeachingHistory;
use App\Library\TermPlan\TermLock;
use App\LocalCourse;
use App\SisAppointment;
use Illuminate\Http\Request;

class GroupTeachingHistoryController extends Controller {
    public function index(Request $request, Group $group) {
        $this->authorize('viewAnyCoursesForGroup', [LocalCourse::class, $group]);

        $validated = $request->validate([
            'start' => 'required|integer',
            'end' => 'required|integer|gte:start',
        ]);

        $deptId = $group->sis_dept_id;

        if ($deptId === null) {
            return ['people' => [], 'sections' => [], 'readOnlyTermIds' => []];
        }

        $sections = TeachingHistory::sectionsBetween((int) $deptId, $validated['start'], $validated['end']);

        $appointedEmplids = SisAppointment::where('dept_id', $deptId)->pluck('emplid');
        $instructorEmplids = $sections->pluck('instructors')->flatten(1)->pluck('emplid');

        $readOnlyTermIds = TermLock::readOnlyTermCodesBetween((int) $deptId, $validated['start'], $validated['end'])
            ->map(fn ($termCode) => (int) $termCode)
            ->sort()
            ->values();

        return [
            'people' => PlanningPeople::forEmplids($deptId, $appointedEmplids->concat($instructorEmplids)),
            'sections' => $sections,
            'readOnlyTermIds' => $readOnlyTermIds,
        ];
    }
}
