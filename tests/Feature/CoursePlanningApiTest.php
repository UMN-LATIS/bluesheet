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
    // $this->withoutExceptionHandling();
    setupMockBandaidApiResponses();

    $this->seed(TestDatabaseSeeder::class);

    // create a group for our tests
    $this->group = Group::factory()->create();

    // act as admin for tests
    $this->admin = User::where('umndid', 'admin')->first();
    $this->basicUser = User::where('umndid', 'basic_user')->first();
});

describe("GET /api/course-planning/groups/:groupId/courses", function () {
    it('gets a list of courses from the SIS class records', function () {
        actingAs($this->admin);

        // get a list of courses for that group
        $res = get("/api/course-planning/groups/{$this->group->id}/courses");
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

    todo('includes unofficial courses in local db', function () {
    });

    it('requires user to have read privileges', function () {
        actingAs($this->basicUser);

        // get a list of courses for that group
        $res = get("/api/course-planning/groups/{$this->group->id}/courses");
        expect($res->status())->toBe(403);
    });
});

describe('GET /api/groups/:groupId/sections', function () {
    it('gets a list of sections from SIS class records', function () {
        actingAs($this->admin);

        $res = get("/api/course-planning/groups/{$this->group->id}/sections");

        expect($res->status())->toBe(200);
        expect($res->json())->not()->toBeEmpty();
        expect($res->json()[0])->toEqual([
            'id' => 'sis-87153',
            'courseId' => 'AFRO-3654',
            'classNumber' => 87153,
            'dbId' => null,
            'termId' => 1195,
            'classSection' => '001',
            'enrollmentCap' => 25,
            'enrollmentTotal' => 0,
            'waitlistCap' => 0,
            'waitlistTotal' => 0,
            'isCancelled' => true,
            'isPublished' => true,
        ]);
    });

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
