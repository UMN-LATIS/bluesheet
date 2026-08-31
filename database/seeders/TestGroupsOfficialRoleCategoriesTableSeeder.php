<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class TestGroupsOfficialRoleCategoriesTableSeeder extends Seeder {
    public function run(): void {
        $categories = [
            ['id' => 1, 'category' => 'Unit'],
            ['id' => 2, 'category' => 'College'],
            ['id' => 3, 'category' => 'Operations'],
        ];

        \DB::table('official_role_categories')->upsert($categories, 'id');
    }
}
