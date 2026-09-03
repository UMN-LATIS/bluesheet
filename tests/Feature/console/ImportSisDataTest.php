<?php

use App\Group;
use App\SisClassSection;
use App\SisCourse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Database\Seeders\TestDatabaseSeeder;

use function Pest\Laravel\artisan;

/**
 * The command rewrites the whole mirror on every run, so the risk worth
 * covering is that it stops swapping cleanly, not that every field maps. It
 * had no test at all before sis_courses was added to the tables it rebuilds.
 */

const DEPT_ID = '10947';

/** One row of Bandaid's class list, which repeats course facts on every section. */
function bandaidClassRecord(array $overrides = []): array {
    return [
        'INSTITUTION' => 'UMNTC',
        'TERM' => 1269,
        'CLASS_NUMBER' => 87153,
        'INSTRUCTOR_EMPLID' => 102,
        'INSTRUCTOR_ROLE' => 'PI',
        'ACADEMIC_ORG' => (int) DEPT_ID,
        'SUBJECT' => 'AFRO',
        'CATALOG_NUMBER' => '3654',
        'CLASS_SECTION' => '001',
        'ACADEMIC_CAREER' => 'UGRD',
        'DESCRIPTION' => 'African Cinema',
        'COMPONENT_CLASS' => 'LEC',
        'ENROLLMENT_CAP' => 25,
        'ENROLLMENT_TOTAL' => 0,
        'WAITLIST_CAP' => 0,
        'WAITLIST_TOTAL' => 0,
        'ACADEMIC_PROGRESS_CREDITS' => 3,
        'CANCELLED' => 0,
        'COURSE_CROSSLIST' => null,
        'TIME_START' => '09:05:00',
        'TIME_END' => '09:55:00',
        'MON' => 1,
        'TUES' => 0,
        'WED' => 1,
        'THURS' => 0,
        'FRI' => 1,
        'SAT' => 0,
        'SUN' => 0,
        ...$overrides,
    ];
}

function fakeBandaid(array $classRecords): void {
    $api = config('bandaid.baseUri');

    Http::fake([
        "{$api}/classes/terms*" => Http::response([[
            'INSTITUTION' => 'UMNTC',
            'TERM' => 1269,
            'ACADEMIC_CAREER' => 'UGRD',
            'TERM_DESCRIPTION' => 'Fall 2026',
            'TERM_BEGIN_DT' => '2026-09-08',
            'TERM_END_DT' => '2026-12-23',
        ]]),
        "{$api}/department?*" => Http::response([[
            'DEPT_ID' => DEPT_ID,
            'DESCRIPTION' => 'African American & African Studies',
        ]]),
        "{$api}/department/*/employees" => Http::response([[
            'EMPLID' => 102,
            'DEPTNAME' => 'African American & African Studies',
            'JOBCODE' => '9403',
            'JOB_INDICATOR' => 'P',
        ]]),
        // this department's classes only: the seeded groups bring dept ids of
        // their own along, and answering for all of them would file another
        // department's sections under this one
        "{$api}/classes/list/" . DEPT_ID => Http::response($classRecords),
        "{$api}/classes/list/*" => Http::response([]),
        "{$api}/names*" => Http::response([[
            'EMPLID' => 102,
            'FULL_NAME' => 'Ana García',
            'FIRST_NAME' => 'Ana',
            'LAST_NAME' => 'García',
        ]]),
    ]);
}

beforeEach(function () {
    $this->seed(TestDatabaseSeeder::class);
    Group::factory()->create(['dept_id' => DEPT_ID]);
});

describe('import:sis', function () {
    it('derives a course row from the sections that mention it', function () {
        fakeBandaid([
            bandaidClassRecord(['CLASS_NUMBER' => 87153, 'CLASS_SECTION' => '001']),
            bandaidClassRecord(['CLASS_NUMBER' => 87154, 'CLASS_SECTION' => '002']),
            bandaidClassRecord(['CLASS_NUMBER' => 87155, 'CATALOG_NUMBER' => '1021', 'DESCRIPTION' => 'Intro to Africa']),
        ]);

        artisan('import:sis')->assertSuccessful();

        expect(SisCourse::pluck('course_code')->sort()->values()->all())
            ->toBe(['AFRO-1021', 'AFRO-3654']);

        $course = SisCourse::where('course_code', 'AFRO-3654')->first();
        expect($course->title)->toBe('African Cinema');
        expect($course->credits)->toBe(3);
        expect($course->academic_org)->toBe((int) DEPT_ID);
        expect($course->last_offered_term_code)->toBe(1269);
    });

    it('reports a course fact the newest offering overrode', function () {
        fakeBandaid([
            bandaidClassRecord(['TERM' => 1265, 'CLASS_NUMBER' => 87100, 'DESCRIPTION' => 'African Cinema']),
            bandaidClassRecord(['TERM' => 1269, 'CLASS_NUMBER' => 87153, 'DESCRIPTION' => 'African Cinema and Media']),
        ]);

        artisan('import:sis')
            ->expectsOutputToContain('AFRO-3654 title: kept "African Cinema and Media" from 1269, overrode "African Cinema" from 1265')
            ->assertSuccessful();
    });

    it('stores a course code on each section so the join to sis_courses is one column', function () {
        fakeBandaid([bandaidClassRecord()]);

        artisan('import:sis')->assertSuccessful();

        expect(SisClassSection::first()->course_code)->toBe('AFRO-3654');
    });

    it('swaps the new tables in, leaving no leftovers behind', function () {
        fakeBandaid([bandaidClassRecord()]);

        artisan('import:sis')->assertSuccessful();

        expect(Schema::hasTable('sis_courses_tmp'))->toBeFalse();
        expect(Schema::hasTable('sis_courses_old'))->toBeFalse();
        expect(SisCourse::count())->toBe(1);
    });

    it('runs twice without tripping over the previous run', function () {
        fakeBandaid([bandaidClassRecord()]);

        artisan('import:sis')->assertSuccessful();
        artisan('import:sis')->assertSuccessful();

        expect(SisCourse::count())->toBe(1);
    });

    it('keeps the previous mirror when Bandaid returns no classes at all', function () {
        SisCourse::factory()->create(['course_code' => 'AFRO-9999']);
        fakeBandaid([]);

        artisan('import:sis')->assertFailed();

        expect(SisCourse::pluck('course_code')->all())->toBe(['AFRO-9999']);
    });
});
