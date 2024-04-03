<?php

namespace App\Http\Controllers;

use Auth;
use Illuminate\Http\Request;
use App\Leave;
use App\User;
use App\Group;

class LeavePermissionController extends Controller {
    function show(Request $request, Leave $leave) {
        abort_if(!Auth::user(), 401);

        return [
            'view' => Auth::user()->can('view', $leave),
            'update' => Auth::user()->can('update', $leave),
            'delete' => Auth::user()->can('delete', $leave),
        ];
    }

    function userLeaves(Request $request, User $leaveOwner) {
        abort_if(!Auth::user(), 401);

        return [
            'viewAny' => Auth::user()->can('viewAnyLeavesForUser', [Leave::class, $leaveOwner]),
            'create' => Auth::user()->can('createLeavesForUser', [Leave::class, $leaveOwner]),
        ];
    }

    function groupLeaves(Request $request, Group $group) {
        abort_if(!Auth::user(), 401);

        return [
            'viewAny' => Auth::user()->can('viewAnyLeavesForGroup', [Leave::class, $group]),
            'create' => Auth::user()->can('createLeavesForGroup', [Leave::class, $group]),
        ];
    }
}
