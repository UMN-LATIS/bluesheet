<?php

namespace Database\Factories;

use App\LocalCourse;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\LocalCourse>
 */
class LocalCourseFactory extends Factory {
    protected $model = LocalCourse::class;

    public function definition() {
        return [
            'subject' => strtoupper($this->faker->lexify('????')),
            'catalog_number' => (string) $this->faker->numberBetween(1000, 5999),
            'course_code' => fn(array $attributes) => $attributes['subject'] . '-' . $attributes['catalog_number'],
            'title' => $this->faker->sentence(3),
            'credits' => 3,
            'academic_org' => $this->faker->numberBetween(10000, 99999),
        ];
    }
}
