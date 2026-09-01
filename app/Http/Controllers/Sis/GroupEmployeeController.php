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
     * The people appointed to a group's department, for the faculty list
     * and its filters.
     *
     * Drawn from appointments rather than from who teaches, so that faculty
     * on leave or between assignments still appear.
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
     * Someone can hold several jobs in one department, a chair who also
     * holds a professorship being the usual case, and the roster lists them
     * once. Their primary appointment is the one that describes them.
     *
     * @param Collection<SisAppointment> $appointments
     * @return Collection<SisAppointment>
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
