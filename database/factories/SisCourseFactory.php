<?php

namespace Database\Factories;

use App\SisCourse;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\SisCourse>
 */
class SisCourseFactory extends Factory {
    protected $model = SisCourse::class;

    public function definition() {
        return [
            'subject' => strtoupper($this->faker->lexify('????')),
            'catalog_number' => (string) $this->faker->numberBetween(1000, 5999),
            // a closure so a test overriding either part still gets a
            // matching course code
            'course_code' => fn(array $attributes) => $attributes['subject'] . '-' . $attributes['catalog_number'],
            'title' => $this->faker->sentence(3),
            'credits' => 3,
            'last_offered_term_code' => 1269,
            'academic_org' => $this->faker->numberBetween(10000, 99999),
        ];
    }
}
