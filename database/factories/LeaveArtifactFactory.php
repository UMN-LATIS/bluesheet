<?php

namespace Database\Factories;

use App\Leave;
use Illuminate\Database\Eloquent\Factories\Factory;
use App\LeaveArtifact;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\LeaveArtifact>
 */
class LeaveArtifactFactory extends Factory {

    protected $model = LeaveArtifact::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition() {
        return [
            'label' => $this->faker->sentence,
            'target' => $this->faker->url,
            'leave_id' => Leave::factory(),
        ];
    }
}
