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
                $ldapUser = LDAP::lookupUser($paddedEmplid, 'umnemplid');

                if (!$ldapUser || !$ldapUser->emplid) return;

                // it's possible that emplid is null in the db,
                // but not not null in ldap, so use the umndid as the key
                // and then update (or create) the user
                return User::updateOrCreate([
                    'umndid' => $ldapUser->umndid,
                ], $ldapUser->toArray());
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
