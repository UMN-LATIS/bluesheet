<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\ParentOrganization;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\ParentOrganization>
 */
class ParentOrganizationFactory extends Factory {

    protected $model = ParentOrganization::class;
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition() {
        return [
            'group_title' => $this->faker->words(3, true),
            'parent_organization_id' => null,
        ];
    }
}
