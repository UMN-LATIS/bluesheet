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
                $leaves = Leave::factory()->count(rand(1, 3))->create();
                $user->leaves()->saveMany($leaves);
            });

        // create a few leaves for basic_user
        $basicUser = User::where('umndid', 'basic_user')->first();
        Leave::factory()->pastLeave()->count(3)->for($basicUser)->create();
        Leave::factory()->futureLeave()->count(2)->for($basicUser)->create();
    }
}
