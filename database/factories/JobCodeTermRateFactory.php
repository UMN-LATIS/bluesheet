<?php

namespace Database\Factories;

use App\JobCode;
use App\JobCodeTermRate;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\JobCodeTermRate>
 */
class JobCodeTermRateFactory extends Factory {
    protected $model = JobCodeTermRate::class;

    public function definition() {
        return [
            'job_code_id' => JobCode::factory(),
            'term_code' => 1269,
            'salary' => 10000,
            'fringe_rate' => 0.385,
        ];
    }
}
