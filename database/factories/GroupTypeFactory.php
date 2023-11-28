<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\GroupType;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\GroupType>
 */
class GroupTypeFactory extends Factory {

    protected $model = GroupType::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition() {
        return [
            'label' => $this->faker->word(),
        ];
    }
}
