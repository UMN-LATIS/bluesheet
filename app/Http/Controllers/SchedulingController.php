<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use \App\Library\Bandaid;
use App\Library\LDAP as LDAP;

class SchedulingController extends Controller
{

    public function getTerms() {
        $bandaid = new Bandaid();
        $terms = $bandaid->getTerms();
        return response()->json($terms);
    }

    // This method will be slow when fetching all terms for a department
    // if it becomes too slow, here's some ideas:
    // 1. Cache the results so that a refresh won't be as slow
    // 2. Break the fetches up client side and do progressive population
    public function getSchedulingReport(\App\Group $group, $startTerm = null, $endTerm = null)
    {
        set_time_limit(0);
        ini_set('memory_limit', '256M');

        if(!$group->dept_id) {
            return response()->json(['error' => 'Group does not have a department.'], 400);
        }

        // get all the terms
        $bandaid = new Bandaid();
        $terms = $bandaid->getTerms();
        foreach($terms as $term) {
            $courses[$term->TERM] = $bandaid->getDepartmentScheduleForTerm($group->dept_id, $term->TERM);
        }

        foreach($courses as $term => $coursesForTerm) {
            foreach($coursesForTerm as $course) {
                if($course->INSTRUCTOR_EMPLID) {
                    $user = \App\User::where('emplid', $course->INSTRUCTOR_EMPLID)->with('leaves')->first();
                    if(!$user) {
                        $foundUser = LDAP::lookupUser($course->INSTRUCTOR_EMPLID, 'umnemplid');
                        if($foundUser) {
                            $user = $foundUser;
                            $user->save();
                        }
                    }

                    if($user) {
                        $course->instructor = $user;
                    }

                }
            }
        }

        return response()->json([
            "terms"=>$terms,
            "courses"=>$courses
        ]);

    }
}
