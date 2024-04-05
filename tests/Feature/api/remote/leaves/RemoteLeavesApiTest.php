<?php

use App\CourseSection;
use App\Group;
use App\Leave;
use Database\Seeders\TestDatabaseSeeder;
use App\Library\Bandaid;
use App\User;
use Illuminate\Support\Facades\Http;

use function Pest\Laravel\{actingAs, getJson, postJson};

beforeEach(function () {
    // permit exceptions to stop the test
    // for easier debugging
    // $this->withoutExceptionHandling();
    setupMockBandaidApiResponses();
    $this->seed(TestDatabaseSeeder::class);

    // create some leaves that overlap with the
    // mocked bandaid terms
    Leave::factory()->count(5)->create([
        'start_date' => '2019-06-01',
        'end_date' => '2019-12-19',
    ]);


    $this->admin = User::where('umndid', 'admin')->first();
    $this->basicUser = User::where('umndid', 'basic_user')->first();
});

describe("GET /api/remote/leaves", function () {
    it('returns a 401 with invalid token', function () {
        $res = getJson('/api/remote/leaves', [
            'Authorization' => 'Bearer invalid_token'
        ]);

        expect($res->status())->toBe(401);
    });

    it('returns a 403 for a non-wildcard token', function () {
        // create a non-wildcard token for basic user
        $token = $this->basicUser->createToken('test_token', ['test'])->plainTextToken;

        $res = getJson('/api/remote/leaves', [
            'Authorization' => 'Bearer ' . $token,
        ]);

        expect($res->status())->toBe(403);
    });

    it('returns a list of leaves with terms', function () {
        // create a wildcard token for admin
        $token = $this->admin->createToken('test_token', ['*'])->plainTextToken;

        $res = getJson('/api/remote/leaves', [
            'Authorization' => 'Bearer ' . $token,
        ]);

        expect($res->status())->toBe(200);

        $data = $res->json();

        expect($data)->not()->toBeEmpty();

        $leave = collect($data)->first();

        expect($leave)->toHaveKeys([
            'id',
            'description',
            'start_date',
            'end_date',
            'status',
            'type',
            'user',
            'terms',
        ]);
    });
});
