<?php

namespace Database\Factories;

use App\Group;
use App\PlannedCourse;
use App\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\PlannedCourse>
 */
class PlannedCourseFactory extends Factory {

    protected $model = PlannedCourse::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition() {
        return [
            'subject' => 'TEST',
            'catalog_number' => (string) $this->faker->numberBetween(1000, 9999),
            'title' => $this->faker->words(5, true),
            'course_type' => 'LEC',
            'course_level' => 'UGRD',
            'user_id' => User::factory(),
            'term_id' => 1,
            'group_id' => Group::factory(),
        ];
    }
}
