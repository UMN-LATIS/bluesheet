<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class TestGroupsGroupTypeRoleTableSeeder extends Seeder
{

    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {
        $roleIdsForAcademicDepartments = [11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 24, 30, 39, 51];

        // This pivot has no unique index, so an upsert would still double every
        // link on a second seeding.
        foreach ($roleIdsForAcademicDepartments as $roleId) {
            \DB::table('group_type_role')->updateOrInsert([
                'group_type_id' => 3,
                'role_id' => $roleId,
            ]);
        }
    }
}
