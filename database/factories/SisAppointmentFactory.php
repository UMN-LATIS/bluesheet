<?php

namespace Database\Factories;

use App\SisAppointment;
use App\SisDepartment;
use App\SisEmployee;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\SisAppointment>
 */
class SisAppointmentFactory extends Factory {
    protected $model = SisAppointment::class;

    public function definition() {
        // emplid and dept_id are business keys, not row ids
        return [
            'emplid' => fn() => SisEmployee::factory()->create()->emplid,
            'dept_id' => fn() => SisDepartment::factory()->create()->dept_id,
            'dept_name' => $this->faker->words(2, true),
            'job_code' => (string) $this->faker->numberBetween(9000, 9999),
            'position_desc' => 'Associate Professor',
            'category' => 'Faculty',
            'job_indicator' => 'P',
        ];
    }
}
