<?php

namespace Database\Factories;

use App\Library\TermPlan\Season;
use App\Library\TermPlan\StudentStatus;
use App\TaAppointmentRate;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\TaAppointmentRate>
 */
class TaAppointmentRateFactory extends Factory {
    protected $model = TaAppointmentRate::class;

    public function definition() {
        return [
            'fiscal_year' => 2027,
            'season' => Season::Fall,
            'student_status' => StudentStatus::Regular,
            'appointment_percent' => 25,
            'cost_per_term' => 13577.79,
        ];
    }
}
