<?php

namespace App\Http\Controllers;

use Auth;
use Illuminate\Http\Request;
use App\Leave;
use App\User;

class LeavesPermissionController extends Controller {
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
            'viewAny' => Auth::user()->can('viewAnyUserLeaves', [Leave::class, $leaveOwner]),
            'create' => Auth::user()->can('createUserLeaves', [Leave::class, $leaveOwner]),
        ];
    }
}
