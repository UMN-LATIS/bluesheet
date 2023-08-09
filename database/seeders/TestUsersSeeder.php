<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\User;

class TestUsersSeeder extends Seeder {

    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run() {
        User::factory()->create([
            'id' => 1,
            'givenname' => 'Admin',
            'surname' => 'McAdmin',
            'displayname' => 'Admin User',
            'email' => 'admin@umn.edu',
            'umndid' => 'admin',
        ]);
    }
}
