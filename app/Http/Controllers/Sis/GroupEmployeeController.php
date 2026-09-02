<?php

namespace App\Http\Controllers\Sis;

use App\Course;
use App\Group;
use App\Http\Controllers\Controller;
use App\Http\Resources\Sis\SisEmployeeResource;
use App\SisAppointment;
use Illuminate\Support\Collection;

class GroupEmployeeController extends Controller {
    /**
     * Everyone appointed to the department, not only those teaching, so
     * faculty on leave still appear.
     */
    public function index(Group $group) {
        $this->authorize('viewAnyCoursesForGroup', [Course::class, $group]);

        if ($group->sis_dept_id === null) {
            return SisEmployeeResource::collection([]);
        }

        $appointments = SisAppointment::query()
            ->where('dept_id', $group->sis_dept_id)
            ->with('employee')
            ->get();

        return SisEmployeeResource::collection(self::onePerPerson($appointments));
    }

    /**
     * One row per person, preferring the primary appointment (job_indicator P).
     */
    private static function onePerPerson(Collection $appointments): Collection {
        return $appointments
            ->sortByDesc(fn(SisAppointment $appointment) => $appointment->job_indicator === 'P')
            ->unique('emplid')
            ->sortBy(fn(SisAppointment $appointment) => [
                $appointment->employee?->last_name,
                $appointment->employee?->first_name,
            ])
            ->values();
    }
}
