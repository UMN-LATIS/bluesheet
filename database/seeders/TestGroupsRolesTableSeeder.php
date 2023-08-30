<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class TestGroupsRolesTableSeeder extends Seeder
{

    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {
        \DB::table('roles')->insert(array (
            0 =>
            array (
                'id' => 11,
                'label' => 'Accountant',
                'created_at' => NULL,
                'updated_at' => NULL,
                'official_role_category_id' => 2,
            ),
            1 =>
            array (
                'id' => 12,
                'label' => 'HR Consultant',
                'created_at' => NULL,
                'updated_at' => NULL,
                'official_role_category_id' => 2,
            ),
            2 =>
            array (
                'id' => 13,
                'label' => 'HR Generalist',
                'created_at' => NULL,
                'updated_at' => NULL,
                'official_role_category_id' => 2,
            ),
            3 =>
            array (
                'id' => 14,
                'label' => 'Payroll Specialist',
                'created_at' => NULL,
                'updated_at' => NULL,
                'official_role_category_id' => 2,
            ),
            4 =>
            array (
                'id' => 15,
                'label' => 'Dept Preparer',
                'created_at' => NULL,
                'updated_at' => NULL,
                'official_role_category_id' => 2,
            ),
            5 =>
            array (
                'id' => 16,
                'label' => 'Development Officer',
                'created_at' => NULL,
                'updated_at' => NULL,
                'official_role_category_id' => 2,
            ),
            6 =>
            array (
                'id' => 17,
                'label' => 'LATIS DC',
                'created_at' => NULL,
                'updated_at' => NULL,
                'official_role_category_id' => 2,
            ),
            7 =>
            array (
                'id' => 18,
                'label' => 'Dir of Graduate Studies ',
                'created_at' => NULL,
                'updated_at' => NULL,
                'official_role_category_id' => 1,
            ),
            8 =>
            array (
                'id' => 19,
                'label' => 'Dept Advisor',
                'created_at' => NULL,
                'updated_at' => NULL,
                'official_role_category_id' => 1,
            ),
            9 =>
            array (
                'id' => 21,
                'label' => 'Dir of Undergraduate Studies',
                'created_at' => NULL,
                'updated_at' => NULL,
                'official_role_category_id' => 1,
            ),
            10 =>
            array (
                'id' => 22,
                'label' => 'Academic Unit Chair/Director',
                'created_at' => NULL,
                'updated_at' => NULL,
                'official_role_category_id' => 1,
            ),
            11 =>
            array (
                'id' => 23,
                'label' => 'Academic Department Administrator',
                'created_at' => NULL,
                'updated_at' => NULL,
                'official_role_category_id' => 1,
            ),
            12 =>
            array (
                'id' => 24,
                'label' => 'Finance Manager',
                'created_at' => NULL,
                'updated_at' => NULL,
                'official_role_category_id' => 2,
            ),
            13 =>
            array (
                'id' => 30,
                'label' => 'Graduate Program Coordinator',
                'created_at' => NULL,
                'updated_at' => NULL,
                'official_role_category_id' => 1,
            ),
            14 =>
            array (
                'id' => 39,
                'label' => 'Research and Academic Support Center Admin',
                'created_at' => NULL,
                'updated_at' => NULL,
                'official_role_category_id' => 1,
            ),
            15 =>
            array (
                'id' => 51,
                'label' => 'Course Scheduler',
                'created_at' => NULL,
                'updated_at' => NULL,
                'official_role_category_id' => 1,
            ),
        ));


    }
}
