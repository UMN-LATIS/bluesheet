<?php

namespace App\Http\Controllers\CoursePlanning;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Library\Bandaid;
use App\Group;
use App\Http\Resources\EnrollmentResource;
use App\User;
use App\Enrollment;


class GroupEnrollmentController extends Controller {

    protected $bandaid;

    public function __construct(Bandaid $bandaid) {
        $this->bandaid = $bandaid;
    }

    public function index(Request $request, Group $group) {
        abort_if($request->user()->cannot('view planned courses'), 403);


        $dbEnrollments = $group->enrollments()->with('user:id,emplid')->get();

        // each "class" in a class list is the section
        // of a course with a particular instructor
        // and their role.
        $sisEnrollments = collect($this->bandaid
            ->getDeptClassList($group->dept_id))
            ->filter(
                // remove classes without instructors
                fn ($classRecord) =>
                $classRecord->INSTRUCTOR_EMPLID !== null &&
                    // and people who aren't instructors or TAs
                    in_array($classRecord->INSTRUCTOR_ROLE, ['PI', 'TA'])
            )->sortBy('sectionId');

        $allGroupEnrollments = $dbEnrollments->concat($sisEnrollments);

        return EnrollmentResource::collection($allGroupEnrollments);
    }

    public function store(Request $request, Group $group) {
        abort_if($request->user()->cannot('edit planned courses'), 403);

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

    public function destroy(Request $request, Group $group, Enrollment $enrollment) {
        abort_if($request->user()->cannot('edit planned courses'), 403);

        $enrollment->delete();

        return response()->json(null, 204);
    }
}
