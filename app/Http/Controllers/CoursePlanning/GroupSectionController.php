<?php

namespace App\Http\Controllers\CoursePlanning;

use App\Http\Controllers\Controller;
use App\Group;
use App\Http\Resources\CourseSectionResource;
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
                $classRecord->INSTRUCTOR_EMPLID !== null
            )->groupBy('CLASS_NUMBER')->map(
                function ($classRecords) {
                    // combine all "instructors" into one section
                    // with a list of enrollments
                    $section = $classRecords->except([
                        'INSTRUCTOR_EMPLID',
                        'INSTRUCTOR_ROLE',
                    ])->first();
                    $section->ENROLLMENTS = $classRecords->map(
                        fn ($classRecord) => ([
                            'id' => join('-', [$classRecord->CLASS_NUMBER, $classRecord->INSTRUCTOR_EMPLID]),
                            'emplId' => $classRecord->INSTRUCTOR_EMPLID,
                            'sectionId' => $classRecord->CLASS_NUMBER,
                            'role' => $classRecord->INSTRUCTOR_ROLE,
                        ])
                    )->toArray();

                    return $section;
                }
            );

        return CourseSectionResource::collection($sections);
    }
}
