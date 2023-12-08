<?php

namespace App\Http\Controllers\CoursePlanning;

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

        // each "section" contains a different enrolled instructor
        $sections = collect($this->bandaid
            ->getDeptClassList($group->dept_id))
            ->filter(
                // filter out sections with no instructor
                fn ($classRecord) =>
                $classRecord->INSTRUCTOR_EMPLID !== null &&
                    // and people who aren't instructors or TAs
                    in_array($classRecord->INSTRUCTOR_ROLE, ['PI', 'TA'])
            )->groupBy('CLASS_NUMBER')->map(
                function ($classRecords) {
                    // combine all "instructors" into one section
                    // with a list of enrollments
                    $section = $classRecords->except([
                        'INSTRUCTOR_EMPLID',
                        'INSTRUCTOR_ROLE',
                    ])->first();
                    $section->ENROLLMENTS = EnrollmentResource::collection($classRecords);

                    return $section;
                }
            );


        return CourseSectionResource::collection($sections);
    }
}
