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

        $deptEmployeesLookup = collect($this->bandaid->getEmployeesForDepartment($group->dept_id))->keyBy('EMPLID');

        $coursesWithInstructors = $this->userService
            ->attachInstructorsToCourses($courses)
            ->filter(function ($course) {
                // exclude courses without instructors
                return isset($course->instructor);
            })
            ->map(function ($course) use ($deptEmployeesLookup) {
                $employee = $deptEmployeesLookup->get($course->INSTRUCTOR_EMPLID);
                $course->instructor['JOBCODE'] = $employee ? $employee->JOBCODE : null;
                $course->instructor['CATEGORY'] = $employee ? $employee->CATEGORY : null;
                return $course;
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
