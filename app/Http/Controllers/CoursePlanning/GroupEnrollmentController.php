<?php

namespace App\Http\Controllers\CoursePlanning;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Library\Bandaid;
use App\Group;
use App\Http\Resources\EnrollmentResource;
use App\User;
use App\Enrollment;
use App\Constants\Permissions;
use App\DTOs\SISEnrollmentDTO;


class GroupEnrollmentController extends Controller {

    protected $bandaid;

    public function __construct(Bandaid $bandaid) {
        $this->bandaid = $bandaid;
    }

    public function index(Request $request, Group $group) {
        $this->authorize('viewAnyEnrollmentsForGroup', [Enrollment::class, $group]);

        $dbEnrollments = $group->enrollments()->with('user:id,emplid')->get();

        // each "class" in a class list is the section
        // of a course with a particular instructor
        // and their role.
        $sisEnrollments = collect($this->bandaid
            ->getAllClassesForDeptInstructors($group->dept_id))
            ->filter(
                // remove classes without instructors
                fn ($classRecord) =>
                $classRecord->INSTRUCTOR_EMPLID !== null &&
                    // and people who aren't instructors or TAs
                    in_array($classRecord->INSTRUCTOR_ROLE, ['PI', 'TA'])
            )->sortBy('sectionId')
            ->map(fn ($classRecord) => new SISEnrollmentDTO($classRecord));

        $allGroupEnrollments = $dbEnrollments->concat($sisEnrollments);

        return EnrollmentResource::collection($allGroupEnrollments);
    }

    public function store(Request $request, Group $group) {
        $this->authorize('editAnyEnrollmentsForGroup', [Enrollment::class, $group]);

        $validated = $request->validate([
            'course_section_id' => 'required|integer',
            'emplid' => 'required|integer',
            'role' => 'required|in:PI,TA',
            'is_published' => 'boolean',
            'is_cancelled' => 'boolean',
        ]);

        $user = User::where('emplid', $validated['emplid'])->firstOrFail();

        $section = $group->courseSections()->findOrFail($validated['course_section_id']);

        $enrollment = $section->enrollments()->create([
            'user_id' => $user->id,
            'role' => $validated['role'],
            'is_published' => $validated['is_published'] ?? false,
            'is_cancelled' => $validated['is_cancelled'] ?? false,
        ]);

        return new EnrollmentResource($enrollment->load('user'));
    }

    public function update(Request $request, Group $group, Enrollment $enrollment) {
        $this->authorize('editAnyEnrollmentsForGroup', [Enrollment::class, $group]);

        $validated = $request->validate([
            'course_section_id' => 'required|exists:course_sections,id',
            'emplid' => 'required|integer',
            'role' => 'required|in:PI,TA',
        ]);

        $user = User::where('emplid', $validated['emplid'])->firstOrFail();

        // check that the section is part of the group
        $section = $group->courseSections()->findOrFail($validated['course_section_id']);

        $enrollment->update([
            'course_section_id' => $section->id,
            'user_id' => $user->id,
            'role' => $validated['role'],
        ]);

        return new EnrollmentResource($enrollment->load('user'));
    }

    public function destroy(Request $request, Group $group, Enrollment $enrollment) {
        $this->authorize('editAnyEnrollmentsForGroup', [Enrollment::class, $group]);

        $enrollment->delete();

        return response()->json(null, 204);
    }
}
