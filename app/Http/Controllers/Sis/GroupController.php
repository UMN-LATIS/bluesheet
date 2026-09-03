<?php

namespace App\Http\Controllers\Sis;

use App\Course;
use App\Group;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

/**
 * The departments a scheduler can open in Term Planning: the groups that
 * name an SIS department and that this user may read courses for.
 */
class GroupController extends Controller {
    public function index(Request $request) {
        $user = $request->user();

        return Group::query()
            ->where('active_group', 1)
            ->whereNotNull('dept_id')
            ->orderBy('group_title')
            ->get()
            ->filter(fn (Group $group) => $group->sis_dept_id !== null)
            ->filter(fn (Group $group) => $user->can(
                'viewAnyCoursesForGroup',
                [Course::class, $group]
            ))
            ->map(fn (Group $group) => [
                'id' => $group->id,
                'name' => $group->group_title,
                'abbreviation' => $group->abbreviation,
            ])
            ->values();
    }
}
