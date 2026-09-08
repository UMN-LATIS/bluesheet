<?php

namespace Database\Factories;

use App\LocalClassSection;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\LocalClassSection>
 */
class LocalClassSectionFactory extends Factory {
    protected $model = LocalClassSection::class;

    public function definition() {
        return [
            'term_code' => 1275,
            'academic_org' => $this->faker->numberBetween(10000, 99999),
            'subject' => strtoupper($this->faker->lexify('????')),
            'catalog_number' => (string) $this->faker->numberBetween(1000, 5999),
            // a closure so a test overriding either part still gets a
            // matching course code
            'course_code' => fn(array $attributes) => $attributes['subject'] . '-' . $attributes['catalog_number'],
            'class_section' => '001',
            'component' => 'LEC',
            'title' => $this->faker->sentence(3),
            'credits' => 3,
            'enrollment_cap' => 30,
            'delivery' => 'onCampus',
            'notes' => null,
            'is_cancelled' => false,
        ];
    }

    public function cancelled(): static {
        return $this->state(['is_cancelled' => true]);
    }
}
