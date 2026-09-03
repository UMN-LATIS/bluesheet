<?php

namespace Database\Factories;

use App\SisDepartment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\SisDepartment>
 */
class SisDepartmentFactory extends Factory {
    protected $model = SisDepartment::class;

    public function definition() {
        return [
            'dept_id' => (string) $this->faker->unique()->numberBetween(10000, 99999),
            'description' => $this->faker->words(2, true),
            'college' => 'CLA',
            'college_description' => 'College of Liberal Arts',
            'zdept_id' => null,
            'campus' => 'UMNTC',
            'campus_description' => 'Twin Cities',
        ];
    }
}
