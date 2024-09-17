<?php

use App\CourseSection;
use App\Group;
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
        $res = getJson("/api/course-planning/groups/{$this->group->id}/courses");
        expect($res->status())->toBe(200);

        $json = $res->json();
        expect($json)->not()->toBeEmpty();
        $courseFromApi = collect($json)->firstWhere('id', 'AFRO-1021');

        expect($courseFromApi)->toMatchArray([
            'id' => 'AFRO-1021',
            'title' => 'Introduction to Africa',
            'subject' =>  'AFRO',
            'catalogNumber' => '1021',
            'courseType' => 'LEC',
            'courseLevel' => 'UGRD',
        ]);
    });

    it('includes unofficial courses in local db', function () {
        // add an unofficial course to the local db
        $course = $this->group->courses()->create([
            'subject' => 'TEST',
            'catalog_number' => '1234',
            'title' => 'Test Course',
            'type' => 'LEC',
            'level' => 'UGRD',
        ]);

        // get a list of courses for that group
        actingAs($this->admin);
        $res = getJson("/api/course-planning/groups/{$this->group->id}/courses");

        // expect that the unofficial course is included
        $courseFromApi = collect($res->json())->firstWhere('id', 'TEST-1234');


        expect($courseFromApi)->not()->toBeNull();
        expect($courseFromApi)->toMatchArray([
            'id' => 'TEST-1234',
            'title' => $course->title,
            'subject' => $course->subject,
            'catalogNumber' => $course->catalog_number,
            'courseType' => $course->type,
            'courseLevel' => $course->level,
        ]);
    });

    it('requires user to have read privileges', function () {
        actingAs($this->basicUser);

        // get a list of courses for that group
        $res = getJson("/api/course-planning/groups/{$this->group->id}/courses");
        expect($res->status())->toBe(403);
    });
});

describe('POST /api/groups/:groupId/courses', function () {
    it('adds unofficial courses to the local db', function () {
        actingAs($this->admin);

        // get a list of courses for that group
        $res = postJson("/api/course-planning/groups/{$this->group->id}/courses", [
            'title' => 'Test Course',
            'subject' => 'TEST',
            'catalog_number' => '1234',
            'type' => 'LEC',
            'level' => 'UGRD',
        ]);
        expect($res->status())->toBe(201);

        // expect that the course was added to the local db
        $course = $this->group
            ->courses
            ->where('subject', 'TEST')
            ->where('catalog_number', '1234')
            ->first();

        expect($course->toArray())->toMatchArray([
            'group_id' => $this->group->id,
            'subject' => 'TEST',
            'catalog_number' => '1234',
            'title' => 'Test Course',
            'type' => 'LEC',
            'level' => 'UGRD',
        ]);
    });

    it('prevents users without edit permissions from adding courses', function () {
        actingAs($this->basicUser);

        // get a list of courses for that group
        $res = postJson("/api/course-planning/groups/{$this->group->id}/courses", [
            'title' => 'Test Course',
            'subject' => 'TEST',
            'catalog_number' => '1234',
            'type' => 'LEC',
            'level' => 'UGRD',
        ]);
        expect($res->status())->toBe(403);

        // expect that the course was not added to the local db
        $course = $this->group
            ->courses
            ->where('subject', 'TEST')
            ->where('catalog_number', '1234')
            ->first();

        expect($course)->toBeNull();
    });

    it('validates course fields', function ($field, $value, $expectedError) {
        actingAs($this->admin);

        $data = [
            'title' => 'Test Course',
            'subject' => 'TEST',
            'catalog_number' => '1234',
            'type' => 'LEC',
            'level' => 'UGRD',
        ];

        // Override the specific field with the value from the dataset
        $data[$field] = $value;

        $res = postJson("/api/course-planning/groups/{$this->group->id}/courses", $data);

        expect($res->status())->toBe(422);
        $json = $res->json();
        $errorMessage = $json['errors'][$field][0];
        expect($errorMessage)->toEqual($expectedError);
    })->with([
        // test cases
        'subject must be a string' => ['subject', 1234, 'The subject must be a string.'],
        'catalog_number must be a string' => ['catalog_number', 123, 'The catalog number must be a string.'],
        'title must be a string' => ['title', 123, 'The title must be a string.'],
        'type must be a string' => ['type', 123, 'The type must be a string.'],
        'level must be a string' => ['level', 123, 'The level must be a string.'],
    ]);

    it('converts everything but title to uppercase', function () {
        actingAs($this->admin);

        $res = postJson("/api/course-planning/groups/{$this->group->id}/courses", [
            'title' => 'Test Course',
            'subject' => 'test',
            'catalog_number' => '1234w',
            'type' => 'lec',
            'level' => 'ugrd',
        ]);

        expect($res->status())->toBe(201);

        // expect that the course was added to the local db
        $course = $this->group
            ->courses
            ->where('subject', 'TEST')
            ->where('catalog_number', '1234W')
            ->first();

        expect($course->toArray())->toMatchArray([
            'group_id' => $this->group->id,
            'subject' => 'TEST',
            'catalog_number' => '1234W',
            'title' => 'Test Course',
            'type' => 'LEC',
            'level' => 'UGRD',
        ]);
    });
});

describe('GET /api/groups/:groupId/sections', function () {
    it('gets a list of sections from SIS class records', function () {
        actingAs($this->admin);

        $res = getJson("/api/course-planning/groups/{$this->group->id}/sections");

        expect($res->status())->toBe(200);
        expect($res->json())->not()->toBeEmpty();
        expect($res->json()[0])->toEqual([
            'id' => 'AFRO-3654-001-1195',
            'courseId' => 'AFRO-3654',
            'dbId' => null,
            'termId' => 1195,
            'classSection' => '001',
            'enrollmentCap' => 25,
            'enrollmentTotal' => 0,
            'waitlistCap' => 0,
            'waitlistTotal' => 0,
            'isCancelled' => true,
            'isPublished' => true,
            'source' => 'sis'
        ]);
    });

    it('includes unofficial sections in local db', function () {
        // add an unofficial section to the local db
        $section = CourseSection::factory()->create([
            'group_id' => $this->group->id,
            'course_id' => 'TEST-1234',
        ]);

        // get a list of sections for this group
        actingAs($this->admin);
        $res = getJson("/api/course-planning/groups/{$this->group->id}/sections");

        // expect that the unofficial section is included
        $sectionFromApi = collect($res->json())->firstWhere('courseId', $section->course_id);
        expect($sectionFromApi)->toEqual([
            'id' => "local-db-{$section->id}",
            'dbId' => $section->id,
            'courseId' => $section->course_id,
            'termId' => $section->term_id,
            'classSection' => $section->class_section,
            'enrollmentCap' => 0,
            'enrollmentTotal' => 0,
            'waitlistCap' => 0,
            'waitlistTotal' => 0,
            'isCancelled' => false,
            'isPublished' => false,
            'source' => 'local'
        ]);
    });

    it('requires user to have read privileges', function () {
        actingAs($this->basicUser);

        $res = getJson("/api/course-planning/groups/{$this->group->id}/sections");
        expect($res->status())->toBe(403);
    });
});

// describe('POST /api/groups/:groupId/sections', function () {
//     todo('creates a new unofficial section for an official SIS course');
//     todo('creates a new unofficial section for an unofficial course');
//     todo('requires the user to have edit privileges');
// });

// describe('PUT /api/groups/:groupId/sections/:sectionId', function () {
//     todo('updates an existing unofficial section');
//     todo('rejects updates for official sections');
//     todo('requires user to have edit privileges');
// });

// describe('DELETE /api/groups/:groupId/sections/:sectionId', function () {
//     todo('deletes an unofficial section');
//     todo('does not delete OFFICIAL sections');
//     todo('requires user to have edit privileges');
// });
