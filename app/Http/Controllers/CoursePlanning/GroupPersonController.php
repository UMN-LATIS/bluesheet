<?php

namespace App\Http\Controllers\CoursePlanning;

use App\Http\Controllers\Controller;
use App\Group;
use App\Http\Resources\PersonResource;
use Illuminate\Http\Request;
use App\Library\Bandaid;
use App\Library\UserService;

class GroupPersonController extends Controller {

    protected $bandaid;
    protected $userService;

    public function __construct(Bandaid $bandaid, UserService $userService) {
        $this->bandaid = $bandaid;
        $this->userService = $userService;
    }

    public function index(Request $request, Group $group) {
        abort_if($request->user()->cannot('view planned courses'), 403);

        $users = $this->userService->getDeptInstructors($group->dept_id);

        return PersonResource::collection($users);
    }
}
