<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class TestGroupsGroupTypeRoleTableSeeder extends Seeder {
    public function run(): void {
        $academicDepartmentsId = 3;
        $roleIds = [11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 24, 30, 39, 51];

        // This pivot has no unique index, so an upsert would still double every
        // link on a second seeding.
        foreach ($roleIds as $roleId) {
            \DB::table('group_type_role')->updateOrInsert([
                'group_type_id' => $academicDepartmentsId,
                'role_id' => $roleId,
            ]);
        }
    }
}
