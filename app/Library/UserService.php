<?php

namespace App\Library;

use App\User;
use Illuminate\Support\Collection;
use App\Library\Bandaid;
use App\Library\Utilities;
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

        // create users for any emplids that aren't in the DB yet, getting
        // as much info as possible from bandaid
        $newUsersFromBandaidInfo = $this->bandaid
            ->getNames($missingEmplids->toArray())
            ->map(function ($bandaidUser) {
                $umndid = $this->resolveUmndid($bandaidUser);
                return User::updateOrCreate(
                    ['umndid' => $umndid],
                    [
                        'givenname' => $bandaidUser->FIRST_NAME,
                        'surname' => $bandaidUser->LAST_NAME,
                        'displayName' => $bandaidUser->FULL_NAME,
                        'umndid' => $umndid,
                        'email' => $bandaidUser->INTERNET_ID . '@umn.edu',
                        'emplid' => (int) $bandaidUser->EMPLID,
                    ]
                );
            })
            ->filter();

        // return the requested users if they exist
        return $dbUsers
            ->concat($newUsersFromBandaidInfo);
    }

    public function findOrCreateByEmplId(int $emplid): ?User {
        $users = $this->findOrCreateManyByEmplId([$emplid]);
        return $users->first();
    }

    /**
     * Find or create a user by their internet id (umndid), using Bandaid's
     * exact-match name search as a fallback when the user isn't in the DB.
     */
    public function findOrCreateByInternetId(string $internetId): ?User {
        $dbUser = User::where('umndid', $internetId)->first();
        if ($dbUser) {
            return $dbUser;
        }

        $bandaidUser = $this->bandaid
            ->searchNames($internetId)
            ->first(fn ($person) => $person->INTERNET_ID === $internetId);

        if (!$bandaidUser) {
            return null;
        }

        $umndid = $this->resolveUmndid($bandaidUser);
        $user = User::updateOrCreate(
            ['umndid' => $umndid],
            [
                'givenname' => $bandaidUser->FIRST_NAME,
                'surname' => $bandaidUser->LAST_NAME,
                'displayName' => $bandaidUser->FULL_NAME,
                'umndid' => $umndid,
                'email' => $bandaidUser->INTERNET_ID . '@umn.edu',
                'emplid' => (int) $bandaidUser->EMPLID,
            ]
        );

        // fill in office/title/ou too, to match the old LDAP lookup's behavior
        $this->refreshProfileFromBandaid($user);
        $user->save();

        return $user;
    }

    /**
     * Bandaid's UMNDID is the true Shibboleth-auth identifier, but it's null
     * for people without an active UMN internet account - fall back to
     * their internet id in that case so we always have a stable key.
     */
    private function resolveUmndid(object $bandaidUser): string {
        return $bandaidUser->UMNDID ?: $bandaidUser->INTERNET_ID;
    }

    /**
     * Bandaid's OFFICE_ADDRESS uses real newlines - convert to the same
     * '$'-delimited format LDAP used, which the frontend already renders.
     */
    private function formatAddress(string $address): string {
        return trim(preg_replace('/\r\n|\r|\n/', ' $ ', trim($address)));
    }

    /**
     * Refresh a user's name, office, title, and department fields from
     * Bandaid. Does not save the user - the caller is responsible for that.
     */
    public function refreshProfileFromBandaid(User $user): void {
        if (!$user->emplid) {
            return;
        }

        $names = $this->bandaid->getNames([$user->emplid])->first();
        if ($names) {
            $user->surname = $names->LAST_NAME;
            $user->givenname = $names->FIRST_NAME;
            $user->displayName = $names->FULL_NAME;
            $user->email = $names->INTERNET_ID . '@umn.edu';
        }

        $employee = $this->bandaid->getEmployeeDetail($user->emplid);
        if (!$employee) {
            return;
        }

        $user->office = isset($employee->OFFICE_ADDRESS) ? $this->formatAddress($employee->OFFICE_ADDRESS) : null;
        $user->title = $employee->POSITION_DESCR ?? null;
        $user->dept_name = $employee->DEPTNAME ?? null;

        if (!empty($employee->DEPTID)) {
            $department = collect($this->bandaid->getDepartments([$employee->DEPTID]))
                ->first(fn ($dept) => $dept->DEPT_ID == $employee->DEPTID);
            if ($department) {
                $user->ou = $department->DESCRIPTION;
            }
        }
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
        $allDeptInstructors = $this->bandaid->getEmployees($allDeptEmplids);

        $allDeptInstructorLookup = collect($allDeptInstructors)->groupBy('EMPLID');

        // get active employees for dept
        $activeDeptEmployees = collect($this->bandaid->getEmployeesForDepartment($deptId))
            ->keyBy('EMPLID');


        $instructors = $this
            ->findOrCreateManyByEmplId($allDeptEmplids)
            ->map(function ($user) use ($allDeptInstructorLookup, $activeDeptEmployees) {
                $instructorRecords = $allDeptInstructorLookup->get($user->emplid) ?? collect();

                $user->hasActiveDeptAppointment = $activeDeptEmployees->has($user->emplid);

                
                $user->jobCategories = $instructorRecords->pluck('CATEGORY')
                    ->map(fn($category) => Utilities::trimWithFallback($category))
                    ->filter()
                    ->unique()
                    ->values()
                    ->toArray();
                    
                $user->jobCodes = $instructorRecords
                    ->pluck('JOBCODE')
                    ->filter()
                    ->unique()
                    ->values()
                    ->toArray();
                
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
        $userManagedDeptIds = $manager->getManagedGroups()->pluck('dept_id')->filter();

        return $userManagedDeptIds->contains(function ($deptId) use ($instructor) {
            return $this->isUserInstructorInDept($instructor, $deptId);
        });
    }
}
