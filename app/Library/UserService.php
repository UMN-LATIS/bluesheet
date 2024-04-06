<?php

namespace App\Library;

use App\User;
use Illuminate\Support\Collection;
use App\Library\Bandaid;
use Exception;
use Illuminate\Support\Facades\Cache;
use RuntimeException;
use InvalidArgumentException;

class UserService {
    private Bandaid $bandaid;

    public function __construct() {
        $this->bandaid = new Bandaid();
    }

    /**
     * Find or create a user for each emplid in the given array
     * @param int[] $emplids
     * @return Collection<User>
     */
    public function findOrCreateManyByEmplId(array $emplids): Collection {
        if (empty($emplids)) {
            return collect();
        }

        $uniqueEmplids = collect($emplids)->unique();

        $dbUsers = User::whereIn('emplid', $uniqueEmplids)
            ->with('leaves')
            ->get()
            ->map(function ($user) {
                $user->leaveIds = $user->leaves->pluck('id')->toArray();
                return $user;
            })->filter();

        // find emplids that don't exist in the DB
        $missingEmplids = $uniqueEmplids->diff($dbUsers->pluck('emplid'));

        // we'll use this to look up fallback names info from Bandaid
        $emplidsNotInLDAP = [];

        // lookup and created missing users from LDAP
        $newUsersFromLDAPInfo = $missingEmplids
            ->map(function ($emplid) use (&$emplidsNotInLDAP) {
                $paddedEmplid = str_pad($emplid, 7, 0, STR_PAD_LEFT);
                $ldapUser = LDAP::lookupUserCached($paddedEmplid, 'umnemplid');

                if (!$ldapUser || !$ldapUser->emplid) {
                    // add the $emplid to the list of users not found in LDAP
                    // so we can look up fallback names info from Bandaid
                    $emplidsNotInLDAP[] = $emplid;
                    return null;
                };

                return User::updateOrCreate(
                    // emplid may be null for some users, so we're using
                    // the using the umndid here since it's guaranteed to be
                    // unique and not null, then we we can update the emplid
                    // if the user already exists
                    ['umndid' => $ldapUser->umndid],

                    // note that updateOrCreate returns the values below and
                    // not the values from the DB. So if the emplid is a string
                    // but the DB stores it as an int, it will be returned as a
                    // string. For this reason, we need to cast the emplid to an
                    // int below so that it matches the DB. Otherwise when
                    // we try to match users by emplid user `"0123"` will be
                    // treated as a different user than `123`.
                    [
                        ...$ldapUser->toArray(),
                        'emplid' => (int) $ldapUser->emplid,
                    ]
                );
            })->filter();

        // now we handle emplids that aren't found in LDAP
        // getting as much info as possible from bandaid
        $newUsersFromBandaidInfo = $this->bandaid
            ->getNames($emplidsNotInLDAP)
            ->map(function ($bandaidUser) {
                return User::updateOrCreate(
                    ['umndid' => $bandaidUser->INTERNET_ID],
                    [
                        'givenname' => $bandaidUser->FIRST_NAME,
                        'surname' => $bandaidUser->LAST_NAME,
                        'displayName' => $bandaidUser->NAME,
                        'umndid' => $bandaidUser->INTERNET_ID,
                        'email' => $bandaidUser->INTERNET_ID . '@umn.edu',
                        'emplid' => (int) $bandaidUser->EMPLID,
                    ]
                );
            })
            ->filter();

        // return the requested users if they exist
        return $dbUsers
            ->concat($newUsersFromLDAPInfo)
            ->concat($newUsersFromBandaidInfo);
    }

    public function findOrCreateByEmplId(int $emplid): ?User {
        $users = $this->findOrCreateManyByEmplId([$emplid]);
        return $users->first();
    }

    /**
     * Get the instructors for a department
     * @param string $deptId
     * @param array $options
     * @param bool $options['refresh'] - Whether to refresh the cache
     * @return Collection<User>
     */
    public function getDeptInstructors(string $deptId, array $options = []): Collection {
        $cacheKey = 'deptInstructors-' . $deptId;

        $defaultOptions = [
            'refresh' => false,
        ];

        $options = array_merge($defaultOptions, $options);

        if ($options['refresh']) {
            Cache::forget($cacheKey);
        }

        $cachedInstructors = Cache::get($cacheKey);
        if ($cachedInstructors) {
            return $cachedInstructors;
        }

        $deptCourses = $this->bandaid->getDeptClassList($deptId);
        $allDeptEmplids = collect($deptCourses)
            ->pluck('INSTRUCTOR_EMPLID')
            ->unique()
            ->filter()
            ->values()
            ->toArray();

        // get employee info from bandaid for job code and category
        // note: only active employees will have a job code
        $activeDeptEmployees = $this->bandaid->getEmployees($allDeptEmplids);

        $activeDeptEmployeeLookup = collect($activeDeptEmployees)->keyBy('EMPLID');

        $instructors = $this
            ->findOrCreateManyByEmplId($allDeptEmplids)
            ->map(function ($user) use ($activeDeptEmployeeLookup) {
                $activeDeptEmployee = $activeDeptEmployeeLookup->get($user->emplid) ?? null;

                $user->jobCategory = $activeDeptEmployee?->CATEGORY ?? null;
                $user->jobCode = $activeDeptEmployee?->JOBCODE ?? null;
                return $user;
            })
            ->values();

        Cache::put($cacheKey, $instructors, now()->addMinutes(10));

        return $instructors;
    }

    public function isUserInstructorInDept(User $maybeInstructor, int $deptId): bool {
        $instructors = $this->getDeptInstructors($deptId);
        return $instructors->contains('id', $maybeInstructor->id);
    }

    public function doesUserManageAnyGroupWithInstructor(User $manager, User $instructor): bool {
        $userManagedDeptIds = $manager->getManagedGroups()->pluck('dept_id');

        return $userManagedDeptIds->contains(function ($deptId) use ($instructor) {
            return $this->isUserInstructorInDept($instructor, $deptId);
        });
    }
}
