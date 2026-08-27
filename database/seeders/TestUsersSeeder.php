<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\User;

class TestUsersSeeder extends Seeder {

    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run() {
        $admin = $this->firstOrCreateUser([
            'givenname' => 'Admin',
            'surname' => 'McAdmin',
            'displayname' => 'Admin User',
            'email' => 'admin@umn.edu',
            'umndid' => 'admin',
            'emplid' => '2328381'
        ]);
        $admin->assignRole('super admin');

        $basicUser = $this->firstOrCreateUser([
            'givenname' => 'Basic',
            'surname' => 'User',
            'displayname' => 'Basic User',
            'email' => 'basic_user@umn.edu',
            'umndid' => 'basic_user',
            'emplid' => '1111114'
        ]);
        $basicUser->assignRole('basic user');

        $viewUser = $this->firstOrCreateUser([
            'givenname' => 'View',
            'surname' => 'User',
            'displayname' => 'View User',
            'email' => 'view_user@umn.edu',
            'umndid' => 'view_user',
            'emplid' => '1111115',
        ]);
        $viewUser->assignRole('view user');

        $groupAdmin = $this->firstOrCreateUser([
            'givenname' => 'Global',
            'surname' => 'Group Admin',
            'displayname' => 'Global Group Admin',
            'email' => 'global_group_admin@umn.edu',
            'umndid' => 'global_group_admin',
            'emplid' => '1111116',
        ]);
        $groupAdmin->assignRole('global group admin');

        $siteAdmin = $this->firstOrCreateUser([
            'givenname' => 'Site',
            'surname' => 'Admin',
            'displayname' => 'Site Admin',
            'email' => 'site_admin@umn.edu',
            'umndid' => 'site_admin',
            'emplid' => '1111117',
        ]);
        $siteAdmin->assignRole('site admin');
    }

    /**
     * Seeding twice should not fail on the unique umndid, and should not
     * leave a second copy of anyone behind.
     */
    private function firstOrCreateUser(array $attributes): User {
        return User::firstWhere('umndid', $attributes['umndid'])
            ?? User::factory($attributes)->create();
    }
}
