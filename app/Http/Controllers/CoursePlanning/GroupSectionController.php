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

        $sections = collect($this->bandaid
            ->getDeptClassList($group->dept_id))
            ->filter(
                fn ($classRecord) =>
                $classRecord->INSTRUCTOR_EMPLID !== null
            )->unique('CLASS_NUMBER');

        return CourseSectionResource::collection($sections);
    }
}
