<?php

use App\User;
use Database\Seeders\TestDatabaseSeeder;
use App\Library\Bandaid;
use Illuminate\Support\Facades\Http;

describe('Course Planning API', function () {
    beforeEach(function () {
        $this->seed(TestDatabaseSeeder::class);
        setupMockBandaidApiResponses();
    });

    todo('gets a list of class records from the SIS using the mock api', function () {
        $bandaidService = new Bandaid();
        $records = $bandaidService->getDeptClassList(1);
        expect($records)->toBeArray();
    });

    describe('Group Courses API', function () {
        describe("GET /api/groups/:groupId/courses", function () {
            todo('gets a list of courses from the SIS class records', function () {
            });

            todo('includes unofficial courses in local db', function () {
            });

            todo('requires user to have read privileges');
        });
    });

    describe('Group Sections API', function () {
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
    });
});
