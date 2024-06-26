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
        $admin = User::factory([
            'givenname' => 'Admin',
            'surname' => 'McAdmin',
            'displayname' => 'Admin User',
            'email' => 'admin@umn.edu',
            'umndid' => 'admin',
            'emplid' => '2328381'
        ])->create();
        $admin->assignRole('super admin');

        $basicUser = User::factory([
            'givenname' => 'Basic',
            'surname' => 'User',
            'displayname' => 'Basic User',
            'email' => 'basic_user@umn.edu',
            'umndid' => 'basic_user',
            'emplid' => '1111114'
        ])->create();
        $basicUser->assignRole('basic user');

        $viewUser = User::factory([
            'givenname' => 'View',
            'surname' => 'User',
            'displayname' => 'View User',
            'email' => 'view_user@umn.edu',
            'umndid' => 'view_user',
            'emplid' => '1111115',
        ])->create();
        $viewUser->assignRole('view user');

        $groupAdmin = User::factory([
            'givenname' => 'Global',
            'surname' => 'Group Admin',
            'displayname' => 'Global Group Admin',
            'email' => 'global_group_admin@umn.edu',
            'umndid' => 'global_group_admin',
            'emplid' => '1111116',
        ])->create();
        $groupAdmin->assignRole('global group admin');

        $siteAdmin = User::factory([
            'givenname' => 'Site',
            'surname' => 'Admin',
            'displayname' => 'Site Admin',
            'email' => 'site_admin@umn.edu',
            'umndid' => 'site_admin',
            'emplid' => '1111117',
        ])->create();
        $siteAdmin->assignRole('site admin');
    }
}
