<?php

namespace Database\Seeders;
use Illuminate\Database\Seeder;

class TestDatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * @return void
     */
    public function run()
    {
        // $this->call(UsersTableSeeder::class);
        $this->call(TestGroupsUsersTableSeeder::class);
        $this->call(TestGroupsModelHasRolesTableSeeder::class);
        $this->call(TestGroupsGroupTypesTableSeeder::class);
        $this->call(TestGroupsOfficialRoleCategoriesTableSeeder::class);
        $this->call(TestGroupsRolesTableSeeder::class);
        $this->call(TestGroupsGroupTypeRoleTableSeeder::class);
        $this->call(ParentOrganizationsTableSeeder::class);

        $user = \App\User::find(1);
        $user->assignRole('admin');
    }
}
