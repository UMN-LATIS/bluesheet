<?php

namespace Database\Factories;

use App\GradTermRate;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\GradTermRate>
 */
class GradTermRateFactory extends Factory {
    protected $model = GradTermRate::class;

    public function definition() {
        return [
            'term_code' => 1269,
            'hourly_rate' => 29.95,
            'health_rate' => 0.289,
            'tuition_per_hour_regular' => 25.08,
            'tuition_per_hour_abd' => 3.98,
            'fee_offset' => 235,
            'international_offset' => 280,
            'per_credit_payment' => 250,
            'default_appointment_percent' => 25,
        ];
    }
}
