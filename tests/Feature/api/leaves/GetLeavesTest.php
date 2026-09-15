<?php

use App\Leave;
use App\User;
use Database\Seeders\TestDatabaseSeeder;
use Laravel\Sanctum\Sanctum;
use function Pest\Laravel\getJson;

beforeEach(function () {
    setupMockBandaidApiResponses();
    $this->seed(TestDatabaseSeeder::class);

    $this->superAdmin = User::where('umndid', 'admin')->first();
});

it('returns 401 for an unauthenticated user', function () {
    getJson('/api/remote/leaves')->assertUnauthorized();
});

it('omits leaves that overlap no academic term', function () {
    Sanctum::actingAs($this->superAdmin);

    $leaveDuringFall2019 = Leave::factory()->create([
        'start_date' => '2019-10-01',
        'end_date' => '2019-11-01',
    ]);
    $leaveAfterEveryTerm = Leave::factory()->create([
        'start_date' => '2021-01-01',
        'end_date' => '2021-01-31',
    ]);

    $returnedIds = getJson('/api/remote/leaves')
        ->assertOk()
        ->json('*.id');

    expect($returnedIds)->toContain($leaveDuringFall2019->id);
    expect($returnedIds)->not->toContain($leaveAfterEveryTerm->id);
});
