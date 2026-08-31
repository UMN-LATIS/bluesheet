<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class ParentOrganizationsTableSeeder extends Seeder {
    public function run(): void {
        \DB::table('parent_organizations')->updateOrInsert(
            ['id' => 1],
            [
                'group_title' => 'CLA',
                'parent_organization_id' => null,
            ]
        );
    }
}
