<?php

namespace App\Http\Controllers\LeavePlanning;

use App\Group;
use App\Http\Controllers\Controller;
use App\Leave;
use App\Library\LeavePlanning\PlanningPeople;
use App\Library\LeavePlanning\TimelineTermRange;
use App\Library\UserService;
use App\SisAppointment;
use App\SisTerm;
use App\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class GroupLeaveController extends Controller {
    private const DEPARTMENT_TIMEZONE = 'America/Chicago';

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

        $today = Carbon::today(self::DEPARTMENT_TIMEZONE)->toDateString();

        $range = TimelineTermRange::of($terms, $today, $requestedStart, $requestedEnd);

        $startTerm = $terms->firstWhere('term_code', $range['startTermCode']);
        $endTerm = $terms->firstWhere('term_code', $range['endTermCode']);

        $leaves = self::leavesInDepartment($deptId)
            ->where('start_date', '<=', $endTerm->ends_on)
            ->where('end_date', '>=', $startTerm->begins_on)
            ->with('user')
            ->orderBy('start_date')
            ->orderBy('id')
            ->get();

        $leaveEmplids = $leaves->map(fn(Leave $leave) => $leave->user->emplid);

        return [
            'range' => $range,
            'people' => PlanningPeople::forEmplids($deptId, $leaveEmplids),
            'leaves' => $leaves->map(fn(Leave $leave) => self::toPlanningLeaveArray($leave)),
        ];
    }

    public function store(Request $request, Group $group, UserService $userService) {
        $this->authorize('createLeavesForGroup', [Leave::class, $group]);

        $validated = $request->validate([
            'emplid' => ['required', 'integer'],
            'description' => ['required', 'string', 'max:255'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'status' => ['required', Rule::in(Leave::STATUSES)],
            'type' => ['required', Rule::in(Leave::TYPES)],
        ]);

        $owner = self::findOrCreateLeaveOwnerIn($group, $validated['emplid'], $userService);

        // Dropping this as redundant lets a group manager
        // write leaves for any appointee in the department,
        // which PostLeavePlanningLeaveTest asserts is refused.
        $this->authorize('modifyLeavesForUser', [Leave::class, $owner]);

        $leave = Leave::create([
            ...Arr::except($validated, 'emplid'),
            'user_id' => $owner->id,
        ]);

        return self::toPlanningLeaveArray($leave->load('user'));
    }

    /**
     * Creates the user from the directory when BlueSheet
     * holds no row for the emplid. Throws
     * ValidationException when the person is not appointed
     * to this department, or the directory does not know
     * them.
     */
    private static function findOrCreateLeaveOwnerIn(Group $group, int $emplid, UserService $userService): User {
        $deptId = $group->sis_dept_id;

        $isAppointed = $deptId !== null && SisAppointment::query()
            ->where('dept_id', $deptId)
            ->where('emplid', $emplid)
            ->exists();

        if (!$isAppointed) {
            throw ValidationException::withMessages([
                'emplid' => 'That person holds no appointment in this department.',
            ]);
        }

        $owner = $userService->findOrCreateByEmplId($emplid);

        if ($owner === null) {
            throw ValidationException::withMessages([
                'emplid' => 'That person could not be found in the University directory.',
            ]);
        }

        return $owner;
    }

    /**
     * Renaming a key here blanks the leave bars and fails
     * LeavePlanningApiTest, which asserts this array whole.
     */
    private static function toPlanningLeaveArray(Leave $leave): array {
        return [
            'id' => $leave->id,
            'emplid' => $leave->user->emplid,
            'userId' => $leave->user_id,
            'type' => $leave->type,
            'status' => $leave->status,
            'startDate' => $leave->start_date,
            'endDate' => $leave->end_date,
            'description' => $leave->description,
        ];
    }

    private static function leavesInDepartment(string $deptId): Builder {
        $appointedEmplids = SisAppointment::where('dept_id', $deptId)->select('emplid');

        return Leave::query()->whereHas(
            'user',
            fn(Builder $query) => $query->whereIn('emplid', $appointedEmplids),
        );
    }
}
