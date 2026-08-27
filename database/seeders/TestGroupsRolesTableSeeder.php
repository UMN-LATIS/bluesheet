<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class TestGroupsRolesTableSeeder extends Seeder {
    public function run(): void {
        $roles = [
            ['id' => 11, 'label' => 'Accountant', 'official_role_category_id' => 2],
            ['id' => 12, 'label' => 'HR Consultant', 'official_role_category_id' => 2],
            ['id' => 13, 'label' => 'HR Generalist', 'official_role_category_id' => 2],
            ['id' => 14, 'label' => 'Payroll Specialist', 'official_role_category_id' => 2],
            ['id' => 15, 'label' => 'Dept Preparer', 'official_role_category_id' => 2],
            ['id' => 16, 'label' => 'Development Officer', 'official_role_category_id' => 2],
            ['id' => 17, 'label' => 'LATIS DC', 'official_role_category_id' => 2],
            ['id' => 18, 'label' => 'Dir of Graduate Studies ', 'official_role_category_id' => 1],
            ['id' => 19, 'label' => 'Dept Advisor', 'official_role_category_id' => 1],
            ['id' => 21, 'label' => 'Dir of Undergraduate Studies', 'official_role_category_id' => 1],
            ['id' => 22, 'label' => 'Academic Unit Chair/Director', 'official_role_category_id' => 1],
            ['id' => 23, 'label' => 'Academic Department Administrator', 'official_role_category_id' => 1],
            ['id' => 24, 'label' => 'Finance Manager', 'official_role_category_id' => 2],
            ['id' => 30, 'label' => 'Graduate Program Coordinator', 'official_role_category_id' => 1],
            ['id' => 39, 'label' => 'Research and Academic Support Center Admin', 'official_role_category_id' => 1],
            ['id' => 51, 'label' => 'Course Scheduler', 'official_role_category_id' => 1],
        ];

        \DB::table('roles')->upsert($roles, 'id');
    }
}
