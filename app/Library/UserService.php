<?php

namespace App\Library;

use App\User;
use Illuminate\Support\Collection;
use App\Library\Bandaid;

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
        $uniqueEmplids = collect($emplids)->unique();

        $dbUsers = User::whereIn('emplid', $uniqueEmplids)
            ->with('leaves')
            ->get()
            ->map(function ($user) {
                $user->leaveIds = $user->leaves->pluck('id')->toArray();
                return $user;
            })->filter();

        // identify users that dont exist in the DB
        $missingEmplids = $uniqueEmplids->diff($dbUsers->pluck('emplid'));

        // lookup and created missing users from LDAP
        $newUsers = $missingEmplids
            ->map(function ($emplid) {
                $paddedEmplid = str_pad($emplid, 7, 0, STR_PAD_LEFT);
                $ldapUser = LDAP::lookupUserCached($paddedEmplid, 'umnemplid');

                if (!$ldapUser || !$ldapUser->emplid) return;

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

        // return the requested users if they exist
        return $dbUsers->concat($newUsers);
    }

    public function findOrCreateByEmplId(int $emplid): ?User {
        $users = $this->findOrCreateManyByEmplId([$emplid]);
        return $users->first();
    }

    public function getDeptEmployees(string $deptId): Collection {
        $sisDeptEmployees = $this->bandaid->getEmployeesForDepartment($deptId);

        $sisDeptEmployeeLookup = collect($sisDeptEmployees)->keyBy('EMPLID');

        $deptEmplIds = $sisDeptEmployeeLookup->keys()->toArray();

        $users = $this
            ->findOrCreateManyByEmplId($deptEmplIds)
            ->map(function ($user) use ($sisDeptEmployeeLookup) {
                $sisDeptEmployee = $sisDeptEmployeeLookup[$user->emplid];

                // add the sis employee info to the user
                $user->jobCategory = $sisDeptEmployee->CATEGORY;
                $user->jobCode = $sisDeptEmployee?->JOBCODE;
                return $user;
            });


        return $users->values();
    }
}
