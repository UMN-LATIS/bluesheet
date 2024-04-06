<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Role>
 */
class RoleFactory extends Factory {

    protected $model = \App\Role::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array {
        return [
            "label" => $this->faker->text(),
            "official_role_category_id" => 1, // unit
        ];
    }
}
