<?php

use App\Group;
use Database\Seeders\TestDatabaseSeeder;
use App\Library\Bandaid;
use App\User;
use Illuminate\Support\Facades\Http;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\get;

beforeEach(function () {
    // permit exceptions to stop the test
    // for easier debugging
    $this->withoutExceptionHandling();

    $this->seed(TestDatabaseSeeder::class);
    setupMockBandaidApiResponses();

    $admin = User::where('umndid', 'admin')->first();
    actingAs($admin);
});

describe("GET /api/course-planning/groups/:groupId/courses", function () {
    it('gets a list of courses from the SIS class records', function () {
        // create a group
        $group = Group::factory()->create();

        // get a list of courses for that group
        $res = get("/api/course-planning/groups/{$group->id}/courses");

        expect($res->status())->toBe(200);

        $json = $res->json();
        expect($json)->not()->toBeEmpty();
        expect($json[0])->toEqual([
            'id' => 'AFRO-1021',
            'title' => 'Introduction to Africa',
            'subject' =>  'AFRO',
            'catalogNumber' => '1021',
            'courseType' => 'LEC',
            'courseLevel' => 'UGRD',
        ]);
    });

    todo('get courses included particular roles');

    todo('includes unofficial courses in local db', function () {
    });

    todo('requires user to have read privileges');
});

describe('GET /api/groups/:groupId/sections', function () {
    todo('gets a list of sections from SIS class records');

    todo('includes unofficial sections in local db');

    todo('requires user to have read privileges');
});

describe('POST /api/groups/:groupId/sections', function () {
    todo('creates a new unofficial section for an official SIS course');
    todo('creates a new unofficial section for an unofficial course');
    todo('requires the user to have edit privileges');
});

describe('PUT /api/groups/:groupId/sections/:sectionId', function () {
    todo('updates an existing unofficial section');
    todo('rejects updates for official sections');
    todo('requires user to have edit privileges');
});

describe('DELETE /api/groups/:groupId/sections/:sectionId', function () {
    todo('deletes an unofficial section');
    todo('does not delete OFFICIAL sections');
    todo('requires user to have edit privileges');
});
