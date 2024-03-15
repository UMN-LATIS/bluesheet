<?php

namespace App\Http\Controllers;

use App\Group;
use App\Leave;
use App\Library\Bandaid;
use App\Library\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class ReportController extends Controller {

    private static function countLeavesByStatus(Collection $leaves) {
        $leavesByStatus = [
            Leave::STATUS_CONFIRMED => 0,
            Leave::STATUS_PENDING => 0,
            Leave::STATUS_ELIGIBLE => 0,
            Leave::STATUS_CANCELLED => 0,
            'all' => $leaves->count(),
        ];

        foreach ($leaves as $leave) {
            $leavesByStatus[$leave->status]++;
        }

        return $leavesByStatus;
    }


    /**
     * Get the report of leaves within a department, grouped by term
     *
     * @param Collection<Leave> $leaves
     * @param  Collection<Object{
     *  TERM_DESCRIPTION: string,
     *  TERM_BEGIN_DT: string,
     *  TERM_END_DT: string
     * }> $terms
     * @return array
     */
    private static function groupLeavesByTerm(Collection $leaves, Collection $terms) {
        $leavesByTerm = [];

        foreach ($terms->all() as $term) {
            // initialize the given term's collection
            $termName = $term->TERM_DESCRIPTION;
            $termLeaves = [];

            // loop through the leaves and add them if they fall in the term
            // reminder: a leave can span multiple terms
            foreach ($leaves->all() as $leave) {
                if ($leave->doesLeaveFallInTerm($term)) {
                    $termLeaves[] = $leave;
                }
            }

            $leavesByTerm[] = [
                "term" => $termName,
                "leaveCountByStatus" => self::countLeavesByStatus(collect($termLeaves)),

                // NOTE: maybe we want to include the raw
                // list of leaves for client side aggregations?
                // "leaves" => $termLeaves,
            ];
        }
        return $leavesByTerm;
    }



    /**
     * Get the report of leave counts by department
     * and term
     *
     * @param Request $request
     * @return JsonResponse<array{
     *    department: string,
     *    termData: array{
     *       term: string,
     *      leaveCount: int
     *    }[]
     * }>
     */
    public function deptLeavesReport(Request $request, Bandaid $bandaid, UserService  $userService): JsonResponse {
        // TODO: should this be a different permission?
        abort_if($request->user()->cannot('view leaves'), 403);

        $bandaid = new Bandaid();
        $userService = new UserService();

        $terms = collect($bandaid->getCLATerms())
            ->map(fn ($term) => (object) $term)
            ->filter(function ($term) {
                $termStart = Carbon::parse($term->TERM_BEGIN_DT);
                $maxTermStart = now()->addYears(5);
                return $termStart->isBefore($maxTermStart);
            });

        $groups = Group::whereNotNull("dept_id")
            ->get()
            ->filter(function ($group) {
                // it's possible that the dept_id isn't castable to an int
                // if the user has misentered it, so filter these out.
                return filter_var($group->dept_id, FILTER_VALIDATE_INT);
            });

        $reportRows = [];

        foreach ($groups as $group) {
            $deptLeaves = $userService
                ->getDeptInstructors($group->dept_id)
                ->flatMap(fn ($instructor) => $instructor->leaves);

            $leavesByTerm = self::groupLeavesByTerm(
                $deptLeaves,
                $terms
            );

            $reportRows[] = [
                "group" => [
                    "id" => $group->id,
                    "name" => $group->group_title,
                    "dept_id" => $group->dept_id,
                    "abbreviation" => $group->abbreviation,

                ],
                "leavesByTerm" => $leavesByTerm
            ];
        }

        return response()->json($reportRows);
    }
}
