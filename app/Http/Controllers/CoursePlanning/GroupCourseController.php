<?php

namespace App\Http\Controllers\CoursePlanning;

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
        abort_if($request->user()->cannot('view planned courses'), 403);

        $courses = collect($this->bandaid
            ->getDeptClassList($group->dept_id))
            ->map(function ($classRecord) {
                $shortCode = join('-', [
                    $classRecord->SUBJECT, $classRecord->CATALOG_NUMBER,
                ]);

                $classRecord->shortCode = $shortCode;
                return $classRecord;
            })
            ->unique('shortCode')->sortBy('shortCode');

        return CourseResource::collection($courses);
    }

    public function store(Request $request, Group $group) {
        abort_if($request->user()->cannot('edit planned courses'), 403);

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

        return response()->json($course, 201);
    }
}
