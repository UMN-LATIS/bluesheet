<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Group;
use App\PlannedCourse;

class GroupPlannedCourseController extends Controller {
    public function index(Request $request, Group $group) {
        abort_if($request->user()->cannot('view planned courses'), 403);

        return $group->plannedCourses;
    }

    public function show(Request $request, Group $group, PlannedCourse $plannedCourse) {
        abort_if($request->user()->cannot('view planned courses'), 403);

        return $plannedCourse;
    }

    public function store(Request $request, Group $group) {
        abort_if($request->user()->cannot('edit planned courses'), 403);

        $validated = $request->validate([
            'subject' => 'required|string',
            'catalog_number' => 'required|string',
            'title' => 'required|string',
            'course_type' => 'required|string',
            'course_level' => 'required|string',
            'user_id' => 'required|integer|exists:users,id',
            'group_id' => 'required|integer|exists:groups,id',
            'term_id' => 'required|integer',
        ]);

        return $group->plannedCourses()->create($validated);
    }
}
