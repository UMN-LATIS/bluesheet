<?php

use App\Library\Sis\CourseRecordDeriver;

/**
 * Records are built inline rather than read from a fixture, because every case
 * here is about how one course's facts change from term to term, and the
 * shared fixture covers a single term.
 */
function classRecord(array $overrides = []): array {
    return [
        'TERM' => 1269,
        'SUBJECT' => 'TEST',
        'CATALOG_NUMBER' => '1001',
        'ACADEMIC_ORG' => 99999,
        'DESCRIPTION' => 'Introductory Widgetry',
        'COMPONENT_CLASS' => 'LEC',
        'ACADEMIC_PROGRESS_CREDITS' => 3,
        'CANCELLED' => 0,
        ...$overrides,
    ];
}

function derive(array $records): array {
    return (new CourseRecordDeriver())->derive($records);
}

describe('CourseRecordDeriver', function () {
    it('collapses every offering of a course into one row', function () {
        ['courses' => $courses] = derive([
            classRecord(['TERM' => 1265]),
            classRecord(['TERM' => 1269, 'CLASS_SECTION' => '002']),
            classRecord(['CATALOG_NUMBER' => '3011']),
        ]);

        expect($courses->pluck('course_code')->all())->toBe(['TEST-1001', 'TEST-3011']);
        expect($courses->firstWhere('course_code', 'TEST-1001'))->toMatchArray([
            'subject' => 'TEST',
            'catalog_number' => '1001',
            'academic_org' => 99999,
            'title' => 'Introductory Widgetry',
            'credits' => 3,
            'last_offered_term_code' => 1269,
        ]);
    });

    it('treats a lecture and its lab as one course', function () {
        ['courses' => $courses] = derive([
            classRecord(['COMPONENT_CLASS' => 'LEC']),
            classRecord(['COMPONENT_CLASS' => 'LAB']),
        ]);

        expect($courses)->toHaveCount(1);
    });

    it('takes the title from the most recent offering and reports what it overrode', function () {
        ['courses' => $courses, 'conflicts' => $conflicts] = derive([
            classRecord(['TERM' => 1265, 'DESCRIPTION' => 'Intro Widgetry']),
            classRecord(['TERM' => 1269, 'DESCRIPTION' => 'Introduction to Widgetry']),
        ]);

        expect($courses->first()['title'])->toBe('Introduction to Widgetry');
        expect($conflicts->all())->toBe([[
            'course_code' => 'TEST-1001',
            'field' => 'title',
            'kept' => 'Introduction to Widgetry',
            'kept_term_code' => 1269,
            'overridden' => 'Intro Widgetry',
            'overridden_term_code' => 1265,
        ]]);
    });

    it('reports a credit change the same way', function () {
        ['courses' => $courses, 'conflicts' => $conflicts] = derive([
            classRecord(['TERM' => 1265, 'ACADEMIC_PROGRESS_CREDITS' => 4]),
            classRecord(['TERM' => 1269, 'ACADEMIC_PROGRESS_CREDITS' => 3]),
        ]);

        expect($courses->first()['credits'])->toBe(3);
        expect($conflicts->pluck('field')->all())->toBe(['credits']);
        expect($conflicts->first()['overridden'])->toBe(4);
    });

    it('reports one row per displaced value, not one per offering', function () {
        // the same older title on three sections is one disagreement
        ['conflicts' => $conflicts] = derive([
            classRecord(['TERM' => 1265, 'DESCRIPTION' => 'Intro Widgetry']),
            classRecord(['TERM' => 1265, 'DESCRIPTION' => 'Intro Widgetry']),
            classRecord(['TERM' => 1265, 'DESCRIPTION' => 'Intro Widgetry']),
            classRecord(['TERM' => 1269, 'DESCRIPTION' => 'Introduction to Widgetry']),
        ]);

        expect($conflicts)->toHaveCount(1);
    });

    it('reports nothing when a course has kept the same facts throughout', function () {
        ['conflicts' => $conflicts] = derive([
            classRecord(['TERM' => 1265]),
            classRecord(['TERM' => 1269]),
        ]);

        expect($conflicts)->toBeEmpty();
    });

    it('keeps the credits of the newest offering that reports any', function () {
        // around one section in thirty carries no credit value; the newest
        // section being one of those must not blank the course
        ['courses' => $courses, 'conflicts' => $conflicts] = derive([
            classRecord(['TERM' => 1265, 'ACADEMIC_PROGRESS_CREDITS' => 3]),
            classRecord(['TERM' => 1269, 'ACADEMIC_PROGRESS_CREDITS' => null]),
        ]);

        expect($courses->first()['credits'])->toBe(3);
        // silence is not disagreement
        expect($conflicts)->toBeEmpty();
    });

    it('leaves credits null when no offering has ever reported any', function () {
        ['courses' => $courses] = derive([
            classRecord(['ACADEMIC_PROGRESS_CREDITS' => null]),
        ]);

        expect($courses->first()['credits'])->toBeNull();
    });

    it('leaves out a course whose every offering was cancelled', function () {
        ['courses' => $courses] = derive([
            classRecord(['CATALOG_NUMBER' => '3011', 'CANCELLED' => 1]),
            classRecord(['CATALOG_NUMBER' => '1001']),
        ]);

        expect($courses->pluck('course_code')->all())->toBe(['TEST-1001']);
    });

    it('ignores a cancelled section when describing a course still being offered', function () {
        ['courses' => $courses] = derive([
            classRecord(['TERM' => 1269, 'DESCRIPTION' => 'Introductory Widgetry']),
            classRecord(['TERM' => 1273, 'DESCRIPTION' => 'Cancelled Retitling', 'CANCELLED' => 1]),
        ]);

        expect($courses->first()['title'])->toBe('Introductory Widgetry');
        expect($courses->first()['last_offered_term_code'])->toBe(1269);
    });

    it('accepts the objects Bandaid actually returns, not just arrays', function () {
        ['courses' => $courses] = derive([(object) classRecord()]);

        expect($courses->first()['course_code'])->toBe('TEST-1001');
    });
});
