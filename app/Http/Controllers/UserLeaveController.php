<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\User;
use App\Leave;
use Auth;

class UserLeaveController extends Controller {
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index(User $user) {
        $currentUser = Auth::user();
        abort_if($currentUser->cannot('view leaves') && $currentUser->id !== $user->id, 403);

        return Leave::where('user_id', $user->id)->get();
    }
}
