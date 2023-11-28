<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Group;
use App\GroupType;
use App\ParentOrganization;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Group>
 */
class GroupFactory extends Factory {
    protected $model = Group::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition() {
        return [
            'group_title' => $this->faker->sentence(),
            'group_type_id' => GroupType::factory(),
            'private_group' => false,
            'active_group' => true,
            'start_date' => null,
            'end_date' => null,
            'notes' => $this->faker->paragraph(),
            'parent_organization_id' => ParentOrganization::factory(),
            'google_group' => null,
            'show_unit' => $this->faker->boolean(),
            'parent_group_id' => null,
            'abbreviation' => $this->faker->word(),
            'dept_id' => $this->faker->numberBetween(10000, 99999),
            'include_child_groups' => false,
        ];
    }
}
