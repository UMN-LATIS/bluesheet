<?php

namespace App\Http\Controllers;

use \App\Library\Bandaid;
use App\Group;
use App\Http\Resources\CourseWithInstructors;
use App\Library\UserService;

class SchedulingController extends Controller {

    protected $bandaid;
    protected $userService;

    public function __construct(Bandaid $bandaid, UserService $userService) {
        $this->bandaid = $bandaid;
        $this->userService = $userService;
    }

    public function getTerms() {
        return $this->bandaid->getCLATerms();
    }

    public function getDeptCoursesForTerm(int $termId, Group $group) {
        if (!$termId) {
            return response()->json(['error' => 'No term id provided.'], 400);
        }

        if (!$group->dept_id) {
            return response()->json(['error' => 'Group does not have a numeric department id.'], 400);
        }

        $courses = collect(
            $this->bandaid->getDeptScheduleForTerm($group->dept_id, $termId)
        );

        $courseWithInstructors = $this->userService
            ->attachInstructorsToCourses($courses)
            // exclude courses without instructors
            ->filter(function ($course) {
                return isset($course->instructor);
            })
            ->values();

        return CourseWithInstructors::collection($courseWithInstructors);
    }
}
