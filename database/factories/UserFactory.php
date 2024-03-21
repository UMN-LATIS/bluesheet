<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\User>
 */
class UserFactory extends Factory {
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition() {
        $firstName = $this->faker->firstName;
        $lastName = $this->faker->lastName;

        return [
            'givenname' => $firstName,
            'surname' => $lastName,
            'displayname' => $firstName . ' ' . $lastName,
            'email' => $this->faker->unique()->safeEmail,
            'umndid' => $this->faker->unique()->lexify('????????'),
            'emplid' => $this->faker->unique()->randomNumber(7),
            'ou' => $this->faker->randomElement(['TC', 'CLA', 'CBS', 'CSE', 'CEHD', 'CFANS', 'CSOM', 'DENT', 'EDU', 'LAW', 'MED', 'NURS', 'PHARM', 'SPH', 'VETMED']),
            'send_email_reminders' => $this->faker->boolean,
            'notify_of_favorite_changes' => $this->faker->boolean,
        ];
    }
}
