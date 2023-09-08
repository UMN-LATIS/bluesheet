<?php

namespace App\Library;

use App\User;
use Illuminate\Support\Collection;

class UserService {
    private $userCache = [];
    public function findOrCreateByEmplid(string $emplid): ?User {
        if (isset($this->userCache[$emplid])) {
            return $this->userCache[$emplid];
        }
        $user = User::where('emplid', $emplid)->first();
        if ($user) {
            $this->userCache[$emplid] = $user;
            return $user;
        }

        $user = LDAP::lookupUser($emplid, 'umnemplid');
        if (!$user) return null;

        $user->save();
        $this->userCache[$emplid] = $user;
        return $user;
    }

    public function attachInstructorsToCourses(Collection $courses, Collection $employeeList): Collection {

        // prefetch any instructors that we know about and stuff them in our user cache so we avoid n+1 queries
        $allInstructorsFromCourses = $courses->pluck('INSTRUCTOR_EMPLID')->unique()->filter();
        $loadedUsers = User::whereIn('emplid', $allInstructorsFromCourses)->with('leaves')->get();
        $loadedUsers->each(function ($user) {
            $this->userCache[$user->emplid] = $user;
        });

        $keyedEmployeeList = $employeeList->keyBy('EMPLID');

        return $courses->each(function ($course) use ($keyedEmployeeList) {
            if (!$course->INSTRUCTOR_EMPLID) return;

            $course->instructor = $this->findOrCreateByEmplid($course->INSTRUCTOR_EMPLID) ?? null;

            if (!$course->instructor) return;

            // add academic appointment info to instructor
            $employeeInfo = $keyedEmployeeList->get($course->INSTRUCTOR_EMPLID);
            $course->instructor->jobCategory = $employeeInfo?->CATEGORY ?? null;
        });
    }
}
