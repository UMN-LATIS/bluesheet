<?php

namespace App\Http\Controllers\CoursePlanning;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Library\Bandaid;
use App\Group;


class GroupEnrollmentController extends Controller {

    protected $bandaid;

    public function __construct(Bandaid $bandaid) {
        $this->bandaid = $bandaid;
    }

    public function index(Request $request, Group $group) {
        abort_if($request->user()->cannot('view planned courses'), 403);

        $validated = $request->validate([
            'includeRoles' => 'string'
        ]);

        // each "class" in a class list is the section
        // of a course with a particular instructor
        // and their role.
        $enrollments = collect($this->bandaid
            ->getDeptClassList($group->dept_id))
            ->filter(
                // remove classes without instructors
                fn ($classRecord) =>
                $classRecord->INSTRUCTOR_EMPLID !== null
            )->map(function ($classRecord) {
                return [
                    'id' => join('-', [
                        $classRecord->CLASS_NUMBER,
                        $classRecord->INSTRUCTOR_EMPLID,
                    ]),
                    'sectionId' => $classRecord->CLASS_NUMBER,
                    'emplId' => $classRecord->INSTRUCTOR_EMPLID,
                    'role' => $classRecord->INSTRUCTOR_ROLE,
                ];
            })->sortBy('sectionId');


        if (isset($validated['includeRoles'])) {
            $roles = explode(',', $validated['includeRoles']);
            $enrollments = $enrollments->filter(function ($enrollment) use ($roles) {
                return in_array($enrollment['role'], $roles);
            });
        }

        return $enrollments->values();
    }
}
