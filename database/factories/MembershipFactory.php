<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Membership>
 */
class MembershipFactory extends Factory
{
    protected $model = \App\Membership::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'group_id' => \App\Group::factory(),
            'user_id' => \App\User::factory(),
            'role_id' => \App\Role::factory(),
            'start_date' => $this->faker->dateTimeBetween('-36 months', '-1 day'),
            'end_date' => $this->faker->dateTimeBetween('+1 day', '+24 months'),
            'notes' => $this->faker->text(),
            'admin' => false,
        ];
    }
}
