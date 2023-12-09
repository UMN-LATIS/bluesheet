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

        // get all the unpublished sections from our app database
        $unpublishedSections = $group->courseSections()->where('is_published', false)->with('users')->get();

        // each "section" contains a different enrolled instructor
        $publishedSections = collect($this->bandaid
            ->getDeptClassList($group->dept_id))
            ->filter(
                // filter out sections with no instructor
                fn ($classRecord) =>
                $classRecord->INSTRUCTOR_EMPLID !== null &&
                    // and people who aren't instructors or TAs
                    in_array($classRecord->INSTRUCTOR_ROLE, ['PI', 'TA'])
            )->groupBy('CLASS_NUMBER')->map(
                function ($classRecords) {
                    // use the first record to get the section info
                    $section = $classRecords->first();

                    // and then append the group to enrollments
                    $section->ENROLLMENTS = $classRecords;

                    return $section;
                }
            );

        $allGroupSections = $unpublishedSections->concat($publishedSections);

        return CourseSectionResource::collection($allGroupSections);
    }
}
