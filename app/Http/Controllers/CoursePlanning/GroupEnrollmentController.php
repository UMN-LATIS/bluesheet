<?php

namespace App\Http\Controllers\CoursePlanning;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Library\Bandaid;
use App\Group;
use App\Http\Resources\EnrollmentResource;

class GroupEnrollmentController extends Controller {

    protected $bandaid;

    public function __construct(Bandaid $bandaid) {
        $this->bandaid = $bandaid;
    }

    public function index(Request $request, Group $group) {
        abort_if($request->user()->cannot('view planned courses'), 403);

        // each "class" in a class list is the section
        // of a course with a particular instructor
        // and their role.
        $enrollments = collect($this->bandaid
            ->getDeptClassList($group->dept_id))
            ->filter(
                // remove classes without instructors
                fn ($classRecord) =>
                $classRecord->INSTRUCTOR_EMPLID !== null &&
                    // and people who aren't instructors or TAs
                    in_array($classRecord->INSTRUCTOR_ROLE, ['PI', 'TA'])
            )->sortBy('sectionId');

        return EnrollmentResource::collection($enrollments);
    }
}
