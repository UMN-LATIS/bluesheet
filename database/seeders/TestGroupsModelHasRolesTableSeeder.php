<?php

namespace Database\Seeders;

use App\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class TestGroupsModelHasRolesTableSeeder extends Seeder {
    public function run(): void {
        $admin = User::firstWhere('umndid', 'admin');
        $roleIds = Role::whereIn('name', ['basic user', 'view user', 'site admin'])->pluck('id');

        $modelRoles = $roleIds->map(fn ($roleId) => [
            'role_id' => $roleId,
            'model_type' => 'App\\User',
            'model_id' => $admin->id,
        ])->all();

        \DB::table('model_has_roles')->upsert($modelRoles, ['role_id', 'model_type', 'model_id']);
    }
}
