<?php

namespace Database\Factories;

use App\SisEmployee;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\SisEmployee>
 */
class SisEmployeeFactory extends Factory {
    protected $model = SisEmployee::class;

    public function definition() {
        $firstName = $this->faker->firstName();
        $lastName = $this->faker->lastName();

        return [
            'emplid' => $this->faker->unique()->numberBetween(1000000, 9999999),
            'full_name' => "$firstName $lastName",
            'first_name' => $firstName,
            'last_name' => $lastName,
            'internet_id' => $this->faker->unique()->userName(),
            'umndid' => $this->faker->uuid(),
        ];
    }
}
