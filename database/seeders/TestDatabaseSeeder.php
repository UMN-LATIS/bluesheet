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
        $this->call(TestUsersSeeder::class);
        $this->call(TestGroupsModelHasRolesTableSeeder::class);
        $this->call(TestGroupsGroupTypesTableSeeder::class);
        $this->call(TestGroupsOfficialRoleCategoriesTableSeeder::class);
        $this->call(TestGroupsRolesTableSeeder::class);
        $this->call(TestGroupsGroupTypeRoleTableSeeder::class);
        $this->call(ParentOrganizationsTableSeeder::class);

        User::where('umndid', 'admin')->first()->assignRole('super admin');
    }
}
