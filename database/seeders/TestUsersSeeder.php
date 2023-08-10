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
        ])->create();
        $admin->assignRole('super admin');

        $basicUser = User::factory([
            'givenname' => 'Basic',
            'surname' => 'User',
            'displayname' => 'Basic User',
            'email' => 'basic_user@umn.edu',
            'umndid' => 'basic_user',
        ])->create();
        $basicUser->assignRole('basic user');

        $viewUser = User::factory([
            'givenname' => 'View',
            'surname' => 'User',
            'displayname' => 'View User',
            'email' => 'view_user@umn.edu',
            'umndid' => 'view_user',
        ])->create();
        $viewUser->assignRole('view user');

        $groupAdmin = User::factory([
            'givenname' => 'Group',
            'surname' => 'Admin',
            'displayname' => 'Group Admin',
            'email' => 'group_admin@umn.edu',
            'umndid' => 'group_admin',
        ])->create();
        $groupAdmin->assignRole('group admin');

        $siteAdmin = User::factory([
            'givenname' => 'Site',
            'surname' => 'Admin',
            'displayname' => 'Site Admin',
            'email' => 'site_admin@umn.edu',
            'umndid' => 'site_admin',
        ])->create();
        $siteAdmin->assignRole('site admin');
    }
}
