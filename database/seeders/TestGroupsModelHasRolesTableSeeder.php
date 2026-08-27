<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class TestGroupsModelHasRolesTableSeeder extends Seeder {
    public function run(): void {
        // User 1 is the admin created by TestUsersSeeder.
        $modelRoles = [
            ['role_id' => 1, 'model_type' => 'App\\User', 'model_id' => 1],
            ['role_id' => 2, 'model_type' => 'App\\User', 'model_id' => 1],
            ['role_id' => 4, 'model_type' => 'App\\User', 'model_id' => 1],
        ];

        \DB::table('model_has_roles')->upsert($modelRoles, ['role_id', 'model_type', 'model_id']);
    }
}
