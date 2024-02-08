<?php

use App\User;
use Database\Seeders\TestDatabaseSeeder;

describe('App', function () {
    beforeEach(function () {
        // run the database seeder
        $this->seed(TestDatabaseSeeder::class);
    });

    it('gets a response from the homepage', function () {
        // home page should redirect to login page
        $response = $this->get('/');
        $response->assertStatus(302);
    });

    it('ran the seeder', function () {
        $userCount = User::all()->count();
        expect($userCount)->toBeGreaterThan(1);
    });
});
