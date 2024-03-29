<?php

namespace App\Http\Controllers\CoursePlanning;

use App\Constants\Permissions;
use App\Group;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Library\Bandaid;
use App\Library\UserService;

class GroupLeaveController extends Controller {
    protected $bandaid;
    protected $userService;

    public function __construct(Bandaid $bandaid, UserService $userService) {
        $this->bandaid = $bandaid;
        $this->userService = $userService;
    }


    public function index(Request $request, Group $group) {
        abort_if($request->user()->cannot(Permissions::VIEW_ALL_LEAVES), 403);

        $employees = $this->userService->getDeptInstructors($group->dept_id);

        return $employees->flatMap(function ($employee) {
            return $employee->leaves;
        })->map(function ($leave) {
            $termsBetweenDates = $this->bandaid->getTermsOverlappingDates($leave->start_date, $leave->end_date);

            $leave['termIds'] = $termsBetweenDates->pluck('TERM');
            return $leave;
        })->filter(function ($leave) {
            // if terms are empty, then the leave is out of range
            // so remove it from the collection
            return $leave['termIds']->isNotEmpty();
        })->values();
    }
}
