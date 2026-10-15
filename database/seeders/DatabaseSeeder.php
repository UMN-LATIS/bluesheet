<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder {
    public function run(): void {
        // The test fixtures double as the development environment, so that
        // `migrate:fresh --seed` produces an admin to sign in as.
        $this->call(TestDatabaseSeeder::class);
    }
}
