<?php

namespace App\Library;

use App\User;
use Illuminate\Support\Collection;
use App\Library\Bandaid;

class UserService {
    private $userCache = [];
    private $bandaid;

    public function __construct(Bandaid $bandaid) {
        $this->bandaid = $bandaid;
    }

    public function findOrCreateByEmplid(string $emplid): ?User {
        if (isset($this->userCache[$emplid])) {
            return $this->userCache[$emplid];
        }
        $user = User::where('emplid', $emplid)->first();
        if ($user) {
            $this->userCache[$emplid] = $user;
            return $user;
        }

        $user = LDAP::lookupUser(str_pad($emplid, 7, 0, STR_PAD_LEFT), 'umnemplid');
        if (!$user) return null;

        try {
            $user->save();
        } catch (\Exception $e) {
            // user already exists, reload
            $user = User::where('emplid', $emplid)->first();
            if (!$user) return null;
        }

        $this->userCache[$emplid] = $user;
        return $user;
    }

    protected function loadUsersIntoCache(Collection $emplids) {
        $loadedUsers = User::whereIn('emplid', $emplids)->with('leaves')->get();
        $loadedUsers->each(function ($user) {
            $this->userCache[$user->emplid] = $user;
        });
    }

    /**
     * Find or create a user for each emplid in the given array
     * @param int[] $emplids
     * @return Collection<User>
     */
    public function findOrCreateManyByEmplId(array $emplids): Collection {
        $uniqEmplids = collect($emplids)->unique()->filter();

        $this->loadUsersIntoCache($uniqEmplids);

        return $uniqEmplids->map(function ($emplid) {
            return $this->findOrCreateByEmplid($emplid);
        })->filter();
    }

    public function getDeptEmployees(string $deptId): Collection {
        $deptEmployees = $this->bandaid->getEmployeesForDepartment($deptId);

        $deptEmplIds = collect($deptEmployees)->pluck('EMPLID')->toArray();

        $users = $this->findOrCreateManyByEmplId($deptEmplIds)->values();

        return $users;
    }

    public function attachInstructorsToCourses(Collection $courses, Collection $employeeList): Collection {
        // prefetch any instructors that we know about and stuff them in our user cache so we avoid n+1 queries
        $allInstructorsFromCourses = $courses->pluck('INSTRUCTOR_EMPLID')->unique()->filter();
        $this->loadUsersIntoCache($allInstructorsFromCourses);

        return $courses->each(function ($course) use ($employeeList) {
            if (!$course->INSTRUCTOR_EMPLID) return;

            $user = $this->findOrCreateByEmplid($course->INSTRUCTOR_EMPLID);

            if (!$user) {
                $course->instructor = null;
                return;
            }

            $employeeInfo = $employeeList->where('EMPLID', $user->emplid)->first();

            $user->jobCategory = $employeeInfo?->CATEGORY;
            $user->jobCode = $employeeInfo?->JOBCODE;
            $user->instructorRole = $course->INSTRUCTOR_ROLE;

            $course->instructor = $user;
        });
    }
}
