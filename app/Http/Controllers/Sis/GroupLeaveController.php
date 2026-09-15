<?php

namespace App\Http\Controllers\Sis;

use App\Group;
use App\Http\Controllers\Controller;
use App\Http\Resources\Sis\SisLeaveResource;
use App\Leave;
use App\SisAppointment;
use App\SisTerm;
use Illuminate\Http\Request;

class GroupLeaveController extends Controller {
    public function index(Request $request, Group $group) {
        $this->authorize('viewAnyLeavesForGroup', [Leave::class, $group]);

        $validated = $request->validate(['term' => 'required|integer']);

        $term = SisTerm::undergrad()
            ->where('term_code', $validated['term'])
            ->first();

        if ($group->sis_dept_id === null || $term === null) {
            return SisLeaveResource::collection([]);
        }

        $leaves = Leave::query()
            ->where('status', '!=', Leave::STATUS_CANCELLED)
            ->where('start_date', '<=', $term->ends_on)
            ->where('end_date', '>=', $term->begins_on)
            ->whereHas('user', fn($query) => $query->whereIn(
                'emplid',
                SisAppointment::where('dept_id', $group->sis_dept_id)->select('emplid')
            ))
            ->with('user')
            ->get()
            ->sortBy(fn(Leave $leave) => [
                $leave->user?->surname,
                $leave->user?->givenname,
            ])
            ->values();

        return SisLeaveResource::collection($leaves);
    }
}
