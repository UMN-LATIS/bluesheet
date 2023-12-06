<?php

namespace App\Library;

use App\User;
use Illuminate\Support\Collection;
use App\Library\Bandaid;

class UserService {
    private $dbUserCache = [];
    private $bandaid;

    public function __construct(Bandaid $bandaid) {
        $this->bandaid = $bandaid;
    }

    /**
     * Find or create a user for each emplid in the given array
     * @param int[] $emplids
     * @return Collection<User>
     */
    public function findOrCreateManyByEmplId(array $emplids): Collection {
        // first filter out any emplids that we already have in the cache
        $uncachedEmplIds = collect($emplids)->diff(collect($this->dbUserCache)->keys());

        // Bulk fetch uncached users from the DB
        // eager load leaves
        User::whereIn('emplid', $uncachedEmplIds)
            ->with('leaves')
            ->get()
            ->each(function ($user) {
                // pluck leave ids
                $user->leaveIds = $user->leaves->pluck('id')->toArray();

                // add users to the cache
                $this->dbUserCache[$user->emplid] = $user;
            });

        // identify users that dont exist in the DB
        $missingEmplids = collect($emplids)->diff(collect($this->dbUserCache)->keys());

        // lookup and created missing users from LDAP
        $missingEmplids->each(function ($emplid) {
            $ldapUser = LDAP::lookupUser(str_pad($emplid, 7, 0, STR_PAD_LEFT), 'umnemplid');
            if (!$ldapUser) return;
            $user = User::firstOrCreate(['emplid' => $emplid], $ldapUser->toArray());

            // add the created user to the cache
            $this->dbUserCache[$emplid] = $user;
        });

        // return the requested users if they exist
        return collect($emplids)->unique()->map(function ($emplid) {
            return $this->dbUserCache[$emplid] ?? null;
        })->filter();
    }

    public function getDeptEmployees(string $deptId): Collection {
        $employeeInfoLookup = collect($this->bandaid->getEmployeesForDepartment($deptId))->keyBy('EMPLID');


        $deptEmplIds = $employeeInfoLookup->keys()->toArray();

        $users = $this
            ->findOrCreateManyByEmplId($deptEmplIds)
            ->map(function ($dbUser) use ($employeeInfoLookup) {
                return $this->joinDBUserWithEmployeeInfo($dbUser, $employeeInfoLookup[$dbUser->emplid]);
            });

        return $users->values();
    }

    protected function joinDBUserWithEmployeeInfo(User $user, $employeeInfo) {
        $user->jobCategory = $employeeInfo?->CATEGORY;
        $user->jobCode = $employeeInfo?->JOBCODE;

        return $user;
    }

    public function attachInstructorsToCourses(Collection $courses, Collection $employeeList): Collection {
        // prefetch any instructors that we know about and stuff them in our user cache so we avoid n+1 queries
        $emplids = $courses->pluck('INSTRUCTOR_EMPLID')->unique()->filter();
        // $this->loadUsersIntoCache($allInstructorsFromCourses);

        $dbUserLookup = $this
            ->findOrCreateManyByEmplId($emplids->toArray())
            ->keyBy('emplid');

        $employeeInfoLookup = $employeeList->keyBy('EMPLID');

        // augment db user info with employee info from bandaid
        $usersWithJobInfo = $dbUserLookup->map(function ($user) use ($employeeInfoLookup) {
            return $this->joinDBUserWithEmployeeInfo($user, $employeeInfoLookup[$user->emplid]);
        });

        // attach instructors to courses
        $courses->each(function ($course) use ($usersWithJobInfo) {
            $course->instructor = $usersWithJobInfo[$course->INSTRUCTOR_EMPLID];
        });

        return $courses;
    }
}
