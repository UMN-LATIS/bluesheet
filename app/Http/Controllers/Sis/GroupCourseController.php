<?php

namespace App\Http\Controllers\Sis;

use App\Course;
use App\Group;
use App\Http\Controllers\Controller;
use App\Http\Resources\Sis\SisCourseResource;
use App\SisCourse;

class GroupCourseController extends Controller {
    /**
     * Every course the department has ever taught, with title and credits
     * from its latest offering.
     */
    public function index(Group $group) {
        $this->authorize('viewAnyCoursesForGroup', [Course::class, $group]);

        if ($group->sis_dept_id === null) {
            return SisCourseResource::collection([]);
        }

        $courses = SisCourse::query()
            ->where('academic_org', (int) $group->sis_dept_id)
            ->orderBy('subject')
            ->orderBy('catalog_number')
            ->get();

        return SisCourseResource::collection($courses);
    }
}
