<?php

namespace App\Http\Controllers;

use App\Group;
use App\Course;
use Illuminate\Http\Request;

class CoursePermissionController extends Controller {
    function groupCourses(Request $request, Group $group) {
        abort_if(!$request->user(), 401);

        return [
            'viewAny' => $request->user()->can('viewAnyCoursesForGroup', [Course::class, $group]),
            'create' => $request->user()->can('editAnyCoursesForGroup', [Course::class, $group]),
        ];
    }
}
