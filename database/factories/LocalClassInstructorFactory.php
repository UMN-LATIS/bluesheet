<?php

namespace Database\Factories;

use App\LocalClassInstructor;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\LocalClassInstructor>
 */
class LocalClassInstructorFactory extends Factory {
    protected $model = LocalClassInstructor::class;

    public function definition() {
        return [
            'emplid' => $this->faker->unique()->numberBetween(1000, 9999),
            'role' => 'PI',
        ];
    }
}
