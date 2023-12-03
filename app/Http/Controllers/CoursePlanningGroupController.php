<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Library\Bandaid;
use App\Library\UserService;
use App\Group;
use App\Http\Resources\TermResource;

class CoursePlanningGroupController extends Controller {

    protected $bandaid;
    protected $userService;

    public function __construct(Bandaid $bandaid, UserService $userService) {
        $this->bandaid = $bandaid;
        $this->userService = $userService;
    }


    public function show(Request $request, Group $group) {
        abort_if($request->user()->cannot('view planned courses'), 403);

        $terms = $this->bandaid->getCLATerms();
        $courses = $terms->map(fn ($term) => $this->bandaid->getDeptScheduleForTerm($group->dept_id, $term->id));

        return response()->json([
            'terms' => TermResource::collection($terms),
            'courses' => $courses,
        ]);
    }
}
