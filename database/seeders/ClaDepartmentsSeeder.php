<?php

namespace Database\Seeders;

use App\Group;
use App\GroupType;
use App\ParentOrganization;
use Illuminate\Database\Seeder;

/**
 * Every CLA department that owns classes, so import:sis can be exercised at
 * production scale. Not part of the default dev seed: these 36 departments pull
 * roughly 55,000 sections, which is more than routine development wants.
 *
 *   sail artisan db:seed --class=ClaDepartmentsSeeder
 *   sail artisan import:sis
 */
class ClaDepartmentsSeeder extends Seeder {
    public function run(): void {
        $cla = ParentOrganization::where('group_title', 'CLA')->firstOrFail();
        $academicDepartmentsType = GroupType::where('label', 'Academic Departments')->firstOrFail();

        $path = database_path('data/cla-departments.json');
        $departments = json_decode(file_get_contents($path))->departments;

        foreach ($departments as $department) {
            if (Group::where('dept_id', $department->deptId)->exists()) {
                continue;
            }

            Group::factory()->create([
                'group_title' => $department->name,
                'dept_id' => $department->deptId,
                'group_type_id' => $academicDepartmentsType->id,
                'parent_organization_id' => $cla->id,
            ]);
        }

        $this->command->info(count($departments) . ' CLA departments seeded.');
    }
}
