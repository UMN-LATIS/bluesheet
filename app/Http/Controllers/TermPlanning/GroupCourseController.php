<?php

namespace App\Http\Controllers\TermPlanning;

use App\Course;
use App\Group;
use App\Http\Controllers\Controller;
use App\Library\TermPlan\CourseUnion;
use App\LocalCourse;
use App\SisCourse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * The courses a department can plan against. Unlike sections, courses are not
 * owned by one side or the other: a scheduler planning an unpublished term
 * still picks mostly from the catalogue the SIS knows, and names a new course
 * only when the SIS has none.
 */
class GroupCourseController extends Controller {
    public function index(Group $group) {
        $this->authorize('viewAnyCoursesForGroup', [Course::class, $group]);

        if ($group->sis_dept_id === null) {
            return [];
        }

        $academicOrg = (int) $group->sis_dept_id;

        return CourseUnion::of(
            SisCourse::where('academic_org', $academicOrg)->get(),
            LocalCourse::where('academic_org', $academicOrg)->get(),
        );
    }

    public function store(Request $request, Group $group) {
        $this->authorize('editAnyCoursesForGroup', [Course::class, $group]);

        if ($group->sis_dept_id === null) {
            abort(403, 'This group has no department to plan for.');
        }

        $academicOrg = (int) $group->sis_dept_id;
        $validated = $request->validate([
            'subject' => 'required|string|max:255',
            'catalogNumber' => 'required|string|max:255',
            'title' => 'required|string|max:255',
            'credits' => 'nullable|integer|min:0',
        ]);

        $courseCode = strtoupper($validated['subject']) . '-' . strtoupper($validated['catalogNumber']);
        $this->assertCourseIsNew($request, $courseCode, $academicOrg);

        $course = LocalCourse::create([
            'course_code' => $courseCode,
            'subject' => strtoupper($validated['subject']),
            'catalog_number' => strtoupper($validated['catalogNumber']),
            'title' => $validated['title'],
            'credits' => $validated['credits'] ?? null,
            'academic_org' => $academicOrg,
            'created_by' => auth()->id(),
            'updated_by' => auth()->id(),
        ]);

        return response()->json(CourseUnion::of(collect(), collect([$course]))->sole(), 201);
    }

    /**
     * A course the department already has, from either side, is not one to
     * name again. Checked against both rather than only the local table,
     * because a course code the SIS already carries would be shadowed by a
     * local row that never wins the union and so would never be seen again.
     */
    private function assertCourseIsNew(Request $request, string $courseCode, int $academicOrg): void {
        $request->merge(['courseCode' => $courseCode]);

        $request->validate([
            'courseCode' => [
                Rule::unique('sis_courses', 'course_code')->where('academic_org', $academicOrg),
                Rule::unique('local_courses', 'course_code')
                    ->where('academic_org', $academicOrg)
                    ->whereNull('deleted_at'),
            ],
        ], [
            'courseCode.unique' => 'This department already has a course with that subject and catalog number.',
        ]);
    }
}
