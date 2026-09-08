<?php

use App\Library\TermPlan\CourseUnion;
use App\LocalCourse;
use App\SisCourse;

/**
 * Models are built unsaved, so this stays a test of the merge rule rather than
 * of the database.
 */
function sisCourse(array $attributes = []): SisCourse {
    return new SisCourse([
        'course_code' => 'ANTH-1001',
        'subject' => 'ANTH',
        'catalog_number' => '1001',
        'title' => 'Human Evolution',
        'credits' => 3,
        'last_offered_term_code' => 1269,
        ...$attributes,
    ]);
}

function localCourse(array $attributes = []): LocalCourse {
    return new LocalCourse([
        'course_code' => 'ANTH-3999',
        'subject' => 'ANTH',
        'catalog_number' => '3999',
        'title' => 'Field Methods',
        'credits' => 4,
        ...$attributes,
    ]);
}

function union(array $sis, array $local) {
    return CourseUnion::of(collect($sis), collect($local));
}

describe('CourseUnion', function () {
    it('marks where each course came from', function () {
        $courses = union([sisCourse()], [localCourse()]);

        expect($courses->pluck('source', 'courseCode')->all())->toBe([
            'ANTH-1001' => 'sis',
            'ANTH-3999' => 'local',
        ]);
    });

    it('lets the SIS win a course code both sides carry', function () {
        // the registrar published the course a scheduler had named by hand
        $courses = union(
            [sisCourse(['course_code' => 'ANTH-3999', 'catalog_number' => '3999', 'title' => 'Field Methods in Anthropology'])],
            [localCourse(['title' => 'Field Methods'])],
        );

        expect($courses)->toHaveCount(1);
        expect($courses->first())->toMatchArray([
            'title' => 'Field Methods in Anthropology',
            'source' => 'sis',
        ]);
    });

    it('reports no last offering for a course the SIS has never seen', function () {
        expect(union([], [localCourse()])->first()['lastOfferedTermId'])->toBeNull();
    });

    it('orders by subject and catalog number, whichever side a course came from', function () {
        $courses = union(
            [sisCourse(['course_code' => 'ANTH-5001', 'catalog_number' => '5001'])],
            [
                localCourse(['course_code' => 'ANTH-1002', 'catalog_number' => '1002']),
                localCourse(['course_code' => 'ZOOL-1001', 'subject' => 'ZOOL', 'catalog_number' => '1001']),
            ],
        );

        expect($courses->pluck('courseCode')->all())
            ->toBe(['ANTH-1002', 'ANTH-5001', 'ZOOL-1001']);
    });

    it('answers with nothing when the department has no courses at all', function () {
        expect(union([], []))->toBeEmpty();
    });
});
