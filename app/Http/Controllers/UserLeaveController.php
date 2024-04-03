<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\User;
use App\Leave;
use App\Http\Resources\LeaveResource;
use Auth;

class UserLeaveController extends Controller {
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index(User $leaveOwner) {
        $this->authorize('viewAnyLeavesForUser', [Leave::class, $leaveOwner]);

        $leaves = Leave::where('user_id', $leaveOwner->id)->get();

        return LeaveResource::collection($leaves);
    }
}
