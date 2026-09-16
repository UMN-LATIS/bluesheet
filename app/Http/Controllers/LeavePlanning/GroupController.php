<?php

namespace App\Http\Controllers\LeavePlanning;

use App\Group;
use App\Http\Controllers\Controller;
use App\Leave;
use Illuminate\Http\Request;

class GroupController extends Controller {
    public function index(Request $request) {
        $user = $request->user();

        return Group::query()
            ->where('active_group', 1)
            ->whereNotNull('dept_id')
            ->orderBy('group_title')
            ->get()
            ->filter(fn(Group $group) => $group->sis_dept_id !== null)
            ->filter(fn(Group $group) => $user->can('viewAnyLeavesForGroup', [Leave::class, $group]))
            ->map(fn(Group $group) => [
                'id' => $group->id,
                'name' => $group->group_title,
                'abbreviation' => $group->abbreviation,
            ])
            ->values();
    }
}
