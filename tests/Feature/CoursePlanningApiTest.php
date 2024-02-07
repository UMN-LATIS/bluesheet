<?php

use App\CourseSection;
use App\Group;
use Database\Seeders\TestDatabaseSeeder;
use App\Library\Bandaid;
use App\User;
use Illuminate\Support\Facades\Http;

use function Pest\Laravel\{actingAs, get, post};

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

describe('POST /api/groups/:groupId/courses', function () {
    it('adds unofficial courses to the local db', function () {
        actingAs($this->admin);

        // get a list of courses for that group
        $res = post("/api/course-planning/groups/{$this->group->id}/courses", [
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

    todo('validates input');
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

    it('includes unofficial sections in local db', function () {
        // add an unofficial section to the local db
        $section = CourseSection::factory()->create([
            'group_id' => $this->group->id,
            'course_id' => 'TEST-1234',
        ]);

        // get a list of sections for this group
        actingAs($this->admin);
        $res = get("/api/course-planning/groups/{$this->group->id}/sections");

        // expect that the unofficial section is included
        $sectionFromApi = collect($res->json())->firstWhere('courseId', $section->course_id);
        expect($sectionFromApi)->toEqual([
            'id' => "db-{$section->id}",
            'dbId' => $section->id,
            'groupId' => $section->group_id,
            'courseId' => $section->course_id,
            'termId' => $section->term_id,
            'classSection' => $section->class_section,
            'enrollmentCap' => 0,
            'enrollmentTotal' => 0,
            'waitlistCap' => 0,
            'waitlistTotal' => 0,
            'isCancelled' => false,
            'isPublished' => false,
        ]);
    });

    it('requires user to have read privileges', function () {
        actingAs($this->basicUser);

        $res = get("/api/course-planning/groups/{$this->group->id}/sections");
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
