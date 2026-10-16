<?php

namespace Database\Factories;

use App\JobCode;
use App\Library\TermPlan\InstructorType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\JobCode>
 */
class JobCodeFactory extends Factory {
    protected $model = JobCode::class;

    public function definition() {
        return [
            'code' => $this->faker->unique()->numerify('9###'),
            'title' => $this->faker->jobTitle(),
            'instructor_type' => InstructorType::PaInstructor,
        ];
    }
}
