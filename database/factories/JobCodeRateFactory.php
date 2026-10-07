<?php

namespace Database\Factories;

use App\JobCode;
use App\JobCodeRate;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\JobCodeRate>
 */
class JobCodeRateFactory extends Factory {
    protected $model = JobCodeRate::class;

    public function definition() {
        return [
            'job_code_id' => JobCode::factory(),
            'fiscal_year' => 2027,
            'cost_per_course' => 10000,
        ];
    }
}
