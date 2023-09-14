<?php

namespace App\Http\Controllers;

use \App\Library\Bandaid;
use App\Group;
use App\Http\Resources\CourseWithInstructors;
use App\Http\Resources\TermResource;
use App\Library\UserService;
use Barryvdh\Debugbar\Facades\Debugbar;
use Illuminate\Http\Request;

class SchedulingController extends Controller {

    protected $bandaid;
    protected $userService;

    public function __construct(Bandaid $bandaid, UserService $userService) {
        $this->bandaid = $bandaid;
        $this->userService = $userService;
    }

    public function getTerms() {
        $terms = $this->bandaid->getCLATerms();
        return TermResource::collection($terms);
    }

    public function getDeptCoursesForTerm(int $termId, Group $group, Request $request) {
        abort_if($request->user()->cannot('view leaves'), 403);

        if (!$termId) {
            return response()->json(['error' => 'No term id provided.'], 400);
        }

        if (!$group->dept_id) {
            return response()->json(['error' => 'Group does not have a numeric department id.'], 400);
        }

        $validated = $request->validate([
            'includeRoles' => 'string'
        ]);


        $courses = collect(
            $this->bandaid->getDeptScheduleForTerm($group->dept_id, $termId)
        );

        $allEmplids = $courses->pluck('INSTRUCTOR_EMPLID')->unique()->filter()->toArray();
        $employeeList = collect($this->bandaid->getEmployees($allEmplids));
        $coursesWithInstructors = $this->userService
            ->attachInstructorsToCourses($courses, $employeeList)
            ->filter(function ($course) {
                // exclude courses without instructors
                return isset($course->instructor);
            })
            ->values();

        if (isset($validated['includeRoles'])) {
            $roles = explode(',', $validated['includeRoles']);
            $coursesWithInstructors = $coursesWithInstructors->filter(function ($course) use ($roles) {
                return in_array($course->INSTRUCTOR_ROLE, $roles);
            });
        }

        return CourseWithInstructors::collection($coursesWithInstructors);
    }
}
