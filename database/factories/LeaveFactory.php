<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Leave;
use App\User;
use Carbon\Carbon;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Leave>
 */
class LeaveFactory extends Factory {

    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Leave::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition() {
        // Start date might be before or after today's date
        $startDate = $this->faker->dateTimeBetween('-36 months', '+24 months');

        // End date should always be after the start date
        $endDate = Carbon::instance($startDate)->addDays($this->faker->numberBetween(30, 365));

        return [
            'user_id' => User::factory(),
            'start_date' => $startDate,
            'end_date' => $endDate,
            'status' => $this->faker->randomElement(Leave::STATUSES),
            'type' => $this->faker->randomElement(Leave::TYPES),
            'description' => $this->faker->sentence(),
        ];
    }

    public function pastLeave() {
        $startDate = $this->faker->dateTimeBetween('-36 months', 'now');
        $endDate = Carbon::instance($startDate)->addDays($this->faker->numberBetween(30, 365));

        return [
            'start_date' => $startDate,
            'end_date' => $endDate,
        ];
    }

    public function futureLeave() {
        $startDate = $this->faker->dateTimeBetween('now', '+24 months');
        $endDate = Carbon::instance($startDate)->addDays($this->faker->numberBetween(30, 365));

        return [
            'start_date' => $startDate,
            'end_date' => $endDate,
        ];
    }

    public function currentLeave() {
        $startDate = $this->faker->dateTimeBetween('-6 months', 'now');
        $endDate = Carbon::instance($startDate)->addMonths($this->faker->numberBetween(7, 12));

        return [
            'start_date' => $startDate,
            'end_date' => $endDate,
        ];
    }
}
