<?php

namespace App\Http\Controllers\CoursePlanning;

use App\Constants\Permissions;
use App\Course;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Library\Bandaid;
use App\Group;
use App\Http\Resources\CourseResource;
use App\DTOs\SISCourseDTO;

class GroupCourseController extends Controller {

    protected $bandaid;

    public function __construct(Bandaid $bandaid) {
        $this->bandaid = $bandaid;
    }

    public function index(Request $request, Group $group) {
        $this->authorize('viewAnyCoursesForGroup', [Course::class, $group]);

        $localCourses = $group->courses;

        $sisCourses = collect($this->bandaid
            ->getAllClassesForDeptInstructors($group->dept_id))
            ->map(fn ($class) => new SISCourseDTO($class));

        $combinedCourses = $localCourses->concat($sisCourses)
            ->unique(fn ($course) => $course->getCourseCode())
            ->sortBy(fn ($course) => $course->getCourseCode());

        return CourseResource::collection($combinedCourses);
    }

    public function store(Request $request, Group $group) {
        $this->authorize('editAnyCoursesForGroup', [Course::class, $group]);

        $validated = $request->validate([
            'subject' => 'required|string',
            'catalog_number' => 'required|string',
            'title' => 'required|string',
            'type' => 'required|string',
            'level' => 'required|string',
        ]);

        $course = Course::create([
            'title' => $validated['title'],
            'subject' => strtoupper($validated['subject']),
            'catalog_number' => strtoupper($validated['catalog_number']),
            'type' => strtoupper($validated['type']),
            'level' => strtoupper($validated['level']),
            'group_id' => $group->id,
        ]);

        return new CourseResource($course);
    }
}
