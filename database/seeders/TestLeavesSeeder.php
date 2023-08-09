<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\User;
use App\Leave;

class TestLeavesSeeder extends Seeder {
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run() {
        // create 10 users and associate them with a random number of leaves
        User::factory()
            ->count(10)
            ->create()
            ->each(function ($user) {
                $leaves = Leave::factory()->count(rand(1, 5))->create();
                $user->leaves()->saveMany($leaves);
            });
    }
}
