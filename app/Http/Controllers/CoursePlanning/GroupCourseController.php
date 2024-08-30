<?php

namespace App\Http\Controllers\CoursePlanning;

use App\Constants\Permissions;
use App\Course;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Library\Bandaid;
use App\Group;
use App\Http\Resources\CourseResource;

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
            ->map(function ($classRecord) {
                $classRecord->source = 'sis';
                $classRecord->courseCode = join('-', [
                    $classRecord->SUBJECT,
                    $classRecord->CATALOG_NUMBER,
                ]);
                return $classRecord;
            })
            ->unique('courseCode')
            ->sortBy('courseCode');

        return CourseResource::collection($localCourses->concat($sisCourses));
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
