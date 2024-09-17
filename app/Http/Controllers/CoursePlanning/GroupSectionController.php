<?php

namespace App\Http\Controllers\CoursePlanning;

use App\CourseSection;
use App\Http\Controllers\Controller;
use App\Group;
use App\Http\Resources\CourseSectionResource;
use App\Http\Resources\EnrollmentResource;
use Illuminate\Http\Request;
use App\Library\Bandaid;
use App\Constants\Permissions;
use App\DTOs\SISCourseSectionDTO;

class GroupSectionController extends Controller {
    protected $bandaid;

    public function __construct(Bandaid $bandaid) {
        $this->bandaid = $bandaid;
    }

    public function index(Request $request, Group $group) {
        $this->authorize('viewAnySectionsForGroup', [CourseSection::class, $group]);

        // get all the unpublished sections from our app database
        $dbSections = $group->courseSections()->with('enrollments')->where('is_published', false)->get();

        // each "section" contains a different enrolled instructor
        $sisSections = collect($this->bandaid
            ->getAllClassesForDeptInstructors($group->dept_id))
            ->filter(
                // filter out sections with no instructor
                fn ($classRecord) =>
                $classRecord->INSTRUCTOR_EMPLID !== null &&
                    // and people who aren't instructors or TAs
                    in_array($classRecord->INSTRUCTOR_ROLE, ['PI', 'TA'])
            )->map(fn ($classRecord) => new SISCourseSectionDTO($classRecord));

        $allGroupSections = $dbSections->concat($sisSections);

        return CourseSectionResource::collection($allGroupSections);
    }

    public function store(Request $request, Group $group) {
        $this->authorize('editAnySectionsForGroup', [CourseSection::class, $group]);

        $validated = $request->validate([
            'course_id' => 'required|string',
            'term_id' => 'required|integer',
            'class_section' => 'string',
            'is_published' => 'boolean',
            'is_cancelled' => 'boolean',
        ]);

        // create new section
        $section = $group->courseSections()->create($validated);

        $section->refresh();

        return new CourseSectionResource($section);
    }

    public function update(Request $request, Group $group, CourseSection $section) {
        $this->authorize('editAnySectionsForGroup', [CourseSection::class, $group]);

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
        $this->authorize('editAnySectionsForGroup', [CourseSection::class, $group]);

        $section->delete();

        return response()->json(null, 204);
    }
}
