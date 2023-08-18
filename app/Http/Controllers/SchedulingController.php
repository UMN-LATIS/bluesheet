<?php

namespace App\Http\Controllers;

use \App\Library\Bandaid;
use App\Group;
use App\Http\Resources\CourseWithInstructors;
use App\Library\UserService;

class SchedulingController extends Controller {

    protected $bandaid;
    protected $userService;

    const TERM_CODES = [
        'FA' => 'Fall',
        'SP' => 'Spring',
        'SU' => 'Summer',
    ];

    public function __construct(Bandaid $bandaid, UserService $userService) {
        $this->bandaid = $bandaid;
        $this->userService = $userService;
    }

    public function getTerms() {
        return $this->bandaid->getCLATerms();
    }

    public function getDeptCoursesForTerm($year, $termCode, Group $group) {
        if (!$group->dept_id) {
            return response()->json(['error' => 'Group does not have a numeric department id.'], 400);
        }

        $termName = self::TERM_CODES[strtoupper($termCode)] . ' ' . $year;

        $courses = $this->bandaid->getDeptCoursesByTermName($group->dept_id, $termName);

        $filters = explode(',', request()->query('filters', ''));

        // if filters set, exclude courses with no instructor
        if (in_array('excludeNullInstructor', $filters)) {
            $courses = $courses->filter(function ($course) {
                return $course->INSTRUCTOR_EMPLID;
            });
        }

        $courseWithInstructors = $this->userService->attachInstructorsToCourses($courses)->values();

        return CourseWithInstructors::collection($courseWithInstructors);
    }
}
