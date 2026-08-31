<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Group;
use App\GroupType;
use App\ParentOrganization;

class TestGroupsSeeder extends Seeder {
    public function run(): void {
        $cla = ParentOrganization::where('group_title', 'CLA')->firstOrFail();
        $committeeType = GroupType::where('label', 'Committee')->firstOrFail();
        $academicDepartmentsType = GroupType::where('label', 'Academic Departments')->firstOrFail();

        // Pin the folder and type, since the factory would otherwise build a
        // throwaway one of each per group and clutter both pickers.
        Group::factory()
            ->count(3)
            ->create([
                'group_type_id' => $committeeType->id,
                'parent_organization_id' => $cla->id,
            ]);

        // These are real University department ids, so Bandaid returns actual
        // course and employee data for these two groups in development.
        $departments = [
            ['group_title' => 'Anthropology', 'abbreviation' => 'ANTH', 'dept_id' => '10950'],
            ['group_title' => 'Psychology', 'abbreviation' => 'PSY', 'dept_id' => '10986'],
        ];

        foreach ($departments as $department) {
            if (Group::where('dept_id', $department['dept_id'])->exists()) {
                continue;
            }

            Group::factory()->create([
                ...$department,
                'group_type_id' => $academicDepartmentsType->id,
                'parent_organization_id' => $cla->id,
            ]);
        }
    }
}
