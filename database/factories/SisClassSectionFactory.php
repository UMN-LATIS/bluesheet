<?php

namespace Database\Factories;

use App\SisClassSection;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\SisClassSection>
 */
class SisClassSectionFactory extends Factory {
    protected $model = SisClassSection::class;

    public function definition() {
        return [
            'term_code' => 1269,
            'class_number' => $this->faker->unique()->numberBetween(10000, 99999),
            'academic_org' => $this->faker->numberBetween(10000, 99999),
            'institution' => 'UMNTC',
            'subject' => strtoupper($this->faker->lexify('????')),
            'catalog_number' => (string) $this->faker->numberBetween(1000, 5999),
            'class_section' => '001',
            'component' => 'LEC',
            'academic_career' => 'UGRD',
            'title' => $this->faker->sentence(3),
            'credits' => 3,
            'enrollment_cap' => 30,
            'enrollment_total' => 25,
            'waitlist_cap' => 5,
            'waitlist_total' => 0,
            'is_cancelled' => false,
            'crosslist' => null,
        ];
    }

    public function cancelled(): static {
        return $this->state(['is_cancelled' => true]);
    }
}
