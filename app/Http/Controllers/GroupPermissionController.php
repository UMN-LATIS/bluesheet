<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Auth;
use App\{Group, Course, Leave};

class GroupPermissionController extends Controller {
    public function subgroups(Request $request, Group $parentGroup) {
        abort_if(!$request->user(), 401);

        return [
            'viewAny' => $request->user()->can('view', [Group::class, $parentGroup]),
            'create' => $request->user()->can('create', [Group::class, $parentGroup]),
        ];
    }
}
