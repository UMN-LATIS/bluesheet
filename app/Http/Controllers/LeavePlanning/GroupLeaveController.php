<?php

namespace App\Http\Controllers\LeavePlanning;

use App\Group;
use App\Http\Controllers\Controller;
use App\Leave;
use App\Library\LeavePlanning\DefaultTermRange;
use App\Library\LeavePlanning\PlanningPeople;
use App\SisAppointment;
use App\SisTerm;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class GroupLeaveController extends Controller {
    public function index(Request $request, Group $group) {
        $this->authorize('viewAnyLeavesForGroup', [Leave::class, $group]);

        $terms = SisTerm::undergrad()->orderBy('term_code')->get();
        $termCodes = $terms->pluck('term_code')->all();

        $validated = $request->validate([
            'start' => ['nullable', 'integer', Rule::in($termCodes)],
            'end' => ['nullable', 'integer', Rule::in($termCodes)],
        ]);

        $requestedStart = $validated['start'] ?? null;
        $requestedEnd = $validated['end'] ?? null;

        if ($requestedStart !== null && $requestedEnd !== null && $requestedStart > $requestedEnd) {
            throw ValidationException::withMessages([
                'end' => 'The end term must not come before the start term.',
            ]);
        }

        $deptId = $group->sis_dept_id;

        if ($deptId === null || $terms->isEmpty()) {
            return ['range' => null, 'people' => [], 'leaves' => []];
        }

        $today = Carbon::today()->toDateString();

        $range = DefaultTermRange::resolve(
            $terms,
            self::leavesInDepartment($deptId)
                ->where('status', '!=', Leave::STATUS_CANCELLED)
                ->where('end_date', '>=', $today)
                ->get(),
            $today,
            $requestedStart,
            $requestedEnd,
        );

        $startTerm = $terms->firstWhere('term_code', $range['startTermId']);
        $endTerm = $terms->firstWhere('term_code', $range['endTermId']);

        $leaves = self::leavesInDepartment($deptId)
            ->where('start_date', '<=', $endTerm->ends_on)
            ->where('end_date', '>=', $startTerm->begins_on)
            ->with('user')
            ->orderBy('start_date')
            ->orderBy('id')
            ->get();

        return [
            'range' => $range,
            'people' => PlanningPeople::inDepartment($deptId, $leaves->map(fn(Leave $leave) => $leave->user->emplid)),
            'leaves' => $leaves->map(fn(Leave $leave) => [
                'id' => $leave->id,
                'emplid' => $leave->user->emplid,
                'userId' => $leave->user_id,
                'type' => $leave->type,
                'status' => $leave->status,
                'startDate' => $leave->start_date,
                'endDate' => $leave->end_date,
                'description' => $leave->description,
            ]),
        ];
    }

    private static function leavesInDepartment(string $deptId): Builder {
        return Leave::query()->whereHas('user', fn(Builder $query) => $query->whereIn(
            'emplid',
            SisAppointment::where('dept_id', $deptId)->select('emplid')
        ));
    }
}
