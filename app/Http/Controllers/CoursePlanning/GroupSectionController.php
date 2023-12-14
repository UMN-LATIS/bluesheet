<?php

namespace App\Http\Controllers\CoursePlanning;

use App\CourseSection;
use App\Http\Controllers\Controller;
use App\Group;
use App\Http\Resources\CourseSectionResource;
use App\Http\Resources\EnrollmentResource;
use Illuminate\Http\Request;
use App\Library\Bandaid;

class GroupSectionController extends Controller {
    protected $bandaid;

    public function __construct(Bandaid $bandaid) {
        $this->bandaid = $bandaid;
    }

    public function index(Request $request, Group $group) {
        abort_if($request->user()->cannot('view planned courses'), 403);

        // get all the unpublished sections from our app database
        $dbSections = $group->courseSections()->with('enrollments')->where('is_published', false)->has('enrollments')->get();

        // each "section" contains a different enrolled instructor
        $sisSections = collect($this->bandaid
            ->getDeptClassList($group->dept_id))
            ->filter(
                // filter out sections with no instructor
                fn ($classRecord) =>
                $classRecord->INSTRUCTOR_EMPLID !== null &&
                    // and people who aren't instructors or TAs
                    in_array($classRecord->INSTRUCTOR_ROLE, ['PI', 'TA'])
            )->groupBy('CLASS_NUMBER')
            ->map(
                // use the first record to get the section info
                fn ($classRecords) => $classRecords->first()
            );

        $allGroupSections = $dbSections->concat($sisSections);

        return CourseSectionResource::collection($allGroupSections);
    }

    public function store(Request $request, Group $group) {
        abort_if($request->user()->cannot('edit planned courses'), 403);

        $validated = $request->validate([
            'course_id' => 'required|string',
            'term_id' => 'required|integer',
            'class_section' => 'string',
            'is_published' => 'boolean',
            'is_cancelled' => 'boolean',
        ]);

        // create new section
        $section = $group->courseSections()->create($validated);

        return new CourseSectionResource($section);
    }

    public function update(Request $request, Group $group, CourseSection $section) {
        abort_if($request->user()->cannot('edit planned courses'), 403);

        $validated = $request->validate([
            'course_id' => 'required|string',
            'term_id' => 'required|integer',
            'class_section' => 'string',
            'enrollment_cap' => 'integer',
            'enrollment_total' => 'integer',
            'is_published' => 'boolean',
            'is_cancelled' => 'boolean',
        ]);

        $section->update($validated);

        return new CourseSectionResource($section);
    }

    public function destroy(Request $request, Group $group, CourseSection $section) {
        abort_if($request->user()->cannot('edit planned courses'), 403);

        $section->delete();

        return response()->json(null, 204);
    }
}
