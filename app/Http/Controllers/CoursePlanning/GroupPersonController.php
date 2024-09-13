<?php

namespace App\Http\Controllers\CoursePlanning;

use App\Http\Controllers\Controller;
use App\Group;
use App\Http\Resources\DeptInstructorResource;
use Illuminate\Http\Request;
use App\Library\Bandaid;
use App\Library\UserService;
use App\Constants\Permissions;

class GroupPersonController extends Controller {

    protected $bandaid;
    protected $userService;

    public function __construct(Bandaid $bandaid, UserService $userService) {
        $this->bandaid = $bandaid;
        $this->userService = $userService;
    }

    public function index(Request $request, Group $group) {
        abort_unless($request->user()->can(Permissions::VIEW_PLANNED_COURSES) || $request->user()->managesGroup($group), 403);

        $allDeptInstructors = $this->userService->getDeptInstructors($group->dept_id);

        return DeptInstructorResource::collection($allDeptInstructors);
    }
}
