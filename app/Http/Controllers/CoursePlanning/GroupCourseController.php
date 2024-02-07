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

        $course = Course::create([
            'group_id' => $group->id,
            'subject' => $request->input('subject'),
            'catalog_number' => $request->input('catalog_number'),
            'title' => $request->input('title'),
            'type' => $request->input('type'),
            'level' => $request->input('level'),
        ]);

        return response()->json($course, 201);
    }
}
