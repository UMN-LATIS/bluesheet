<?php

namespace App\Http\Controllers\TermPlanning;

use App\Course;
use App\Group;
use App\Http\Controllers\Controller;
use App\Library\TermPlan\CourseTeachingHistory;
use Illuminate\Http\Request;

/**
 * Who has taught the course a section is on. The instructor picker lists
 * these ahead of the rest of the department, because staffing a section
 * usually starts from whoever taught it last.
 */
class CourseInstructorController extends Controller {
    public function index(Request $request, Group $group) {
        $this->authorize('viewAnyCoursesForGroup', [Course::class, $group]);

        $courseCode = $request->validate([
            'course' => 'required|string|max:255',
        ])['course'];

        if ($group->sis_dept_id === null) {
            return [];
        }

        return CourseTeachingHistory::of((int) $group->sis_dept_id, $courseCode);
    }
}
