<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\User;

class TestDatabaseSeeder extends Seeder {
    /**
     * Seed the application's database.
     *
     * @return void
     */
    public function run() {
        $this->call([
            TestUsersSeeder::class,
            TestGroupsModelHasRolesTableSeeder::class,
            TestGroupsGroupTypesTableSeeder::class,
            TestGroupsOfficialRoleCategoriesTableSeeder::class,
            TestGroupsRolesTableSeeder::class,
            TestGroupsGroupTypeRoleTableSeeder::class,
            ParentOrganizationsTableSeeder::class,
            TestLeavesSeeder::class,
        ]);

        User::where('umndid', 'admin')->first()->assignRole('super admin');
    }
}
