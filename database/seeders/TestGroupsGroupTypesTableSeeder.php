<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class TestGroupsGroupTypesTableSeeder extends Seeder {
    public function run(): void {
        $groupTypes = [
            ['id' => 1, 'label' => 'Committee'],
            ['id' => 2, 'label' => 'List'],
            ['id' => 3, 'label' => 'Academic Departments'],
            ['id' => 4, 'label' => 'Fun Time'],
            ['id' => 5, 'label' => 'Center'],
            ['id' => 6, 'label' => 'Initiative'],
            ['id' => 7, 'label' => 'Consortium'],
            ['id' => 8, 'label' => 'Program'],
            ['id' => 9, 'label' => 'Administrative Unit'],
            ['id' => 10, 'label' => 'Department'],
        ];

        \DB::table('group_types')->upsert($groupTypes, 'id');
    }
}
