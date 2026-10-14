<?php

namespace Database\Factories;

use App\GradAppointmentLevel;
use App\GradTermRate;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\GradAppointmentLevel>
 */
class GradAppointmentLevelFactory extends Factory {
    protected $model = GradAppointmentLevel::class;

    public function definition() {
        return [
            'grad_term_rate_id' => GradTermRate::factory(),
            'appointment_percent' => 25,
            'hours' => 196,
        ];
    }
}
