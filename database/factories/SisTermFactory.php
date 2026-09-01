<?php

namespace Database\Factories;

use App\SisTerm;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\SisTerm>
 */
class SisTermFactory extends Factory {
    protected $model = SisTerm::class;

    public function definition() {
        return [
            'term_code' => $this->faker->unique()->numberBetween(1000, 9999),
            'institution' => 'UMNTC',
            'academic_career' => 'UGRD',
            'description' => 'Fall 2026',
            'begins_on' => '2026-09-08',
            'ends_on' => '2026-12-23',
        ];
    }
}
