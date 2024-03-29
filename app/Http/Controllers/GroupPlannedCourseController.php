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

        // 404 if the planned course isn't within this group
        abort_if($plannedCourse->group_id !== $group->id, 404);

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
            'term_id' => 'required|integer',
        ]);

        return $group->plannedCourses()->create([
            ...$validated,
            'group_id' => $group->id,
        ]);
    }

    public function update(Request $request, Group $group, PlannedCourse $plannedCourse) {
        abort_if($request->user()->cannot('edit planned courses'), 403);

        // 404 if the planned course isn't within this group
        abort_if($plannedCourse->group_id !== $group->id, 404);

        $validated = $request->validate([
            'subject' => 'required|string',
            'catalog_number' => 'required|string',
            'title' => 'required|string',
            'course_type' => 'required|string',
            'course_level' => 'required|string',
            'user_id' => 'required|integer|exists:users,id',
            'term_id' => 'required|integer',
        ]);

        $plannedCourse->update($validated);

        return $plannedCourse;
    }

    public function destroy(Request $request, Group $group, PlannedCourse $plannedCourse) {
        abort_if($request->user()->cannot('edit planned courses'), 403);

        // 404 if the planned course isn't within this group
        abort_if($plannedCourse->group_id !== $group->id, 404);

        $plannedCourse->delete();

        return response()->noContent();
    }
}
