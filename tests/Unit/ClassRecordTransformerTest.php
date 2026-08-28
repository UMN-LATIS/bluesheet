<?php

use App\Library\Sis\ClassRecordTransformer;

/**
 * Every case below is a shape observed in real Bandaid data. The fixture uses
 * synthetic emplids and invented course titles so nothing personal is committed.
 */

function transformFixture(): Illuminate\Support\Collection {
    // read relative to this file: tests/Unit runs without booting the framework,
    // which is the point of keeping the transformer free of I/O
    $records = json_decode(file_get_contents(__DIR__ . '/../Fixtures/Sis/classRecords.json'));
    return (new ClassRecordTransformer())->transform($records);
}

function sectionByClassNumber(int $classNumber): array {
    return transformFixture()->firstWhere('section.class_number', $classNumber);
}

describe('ClassRecordTransformer', function () {
    it('collapses rows sharing a term and class number into one section', function () {
        // three rows differing only in instructor describe a single section
        expect(transformFixture())->toHaveCount(5);

        $section = sectionByClassNumber(10001)['section'];
        expect($section['subject'])->toBe('TEST');
        expect($section['catalog_number'])->toBe('1001');
        expect($section['title'])->toBe('Introductory Widgetry');
    });

    it('keeps PI, TA and SI instructors but drops the departmental proxy', function () {
        $instructors = sectionByClassNumber(10001)['instructors'];

        expect(collect($instructors)->pluck('role')->sort()->values()->all())->toBe(['PI', 'TA']);
        expect(collect($instructors)->pluck('emplid')->all())->not->toContain(1003);

        // SI survives, so the filter is specific to PRXY rather than an allowlist
        expect(collect(sectionByClassNumber(10005)['instructors'])->pluck('role')->all())->toBe(['SI']);
    });

    it('merges rows sharing a time range into one meeting with combined days', function () {
        // the SIS splits a TThF class into a "TTh" row and an "F" row
        $meetings = sectionByClassNumber(10002)['meetings'];

        expect($meetings)->toHaveCount(1);
        expect($meetings[0]['starts_at'])->toBe('12:20:00');
        expect($meetings[0]['meets_tuesday'])->toBeTrue();
        expect($meetings[0]['meets_thursday'])->toBeTrue();
        expect($meetings[0]['meets_friday'])->toBeTrue();
        expect($meetings[0]['meets_monday'])->toBeFalse();
        expect($meetings[0]['meets_wednesday'])->toBeFalse();
    });

    it('keeps meetings at genuinely different times separate', function () {
        // a MWF lecture plus a shared Thursday evening session
        $meetings = sectionByClassNumber(10003)['meetings'];

        expect($meetings)->toHaveCount(2);
        expect(collect($meetings)->pluck('starts_at')->sort()->values()->all())
            ->toBe(['11:15:00', '17:00:00']);
    });

    it('records no meeting for a section the SIS marks as never meeting', function () {
        // midnight with no day flags is the sentinel for independent study
        expect(sectionByClassNumber(10004)['meetings'])->toBeEmpty();
    });

    it('records no meeting when the time is unknown, even if the day is known', function () {
        // 14 rows in a 42k sample look like this; the day is deliberately dropped
        $section = sectionByClassNumber(10005);

        expect($section['meetings'])->toBeEmpty();
        expect($section['section']['class_number'])->toBe(10005);
    });

    it('produces a section but no instructor when the instructor is missing', function () {
        // the only instructor row for 10005 is the SI; the null-emplid row adds none
        expect(collect(sectionByClassNumber(10005)['instructors'])->pluck('emplid')->all())
            ->toBe([1007]);
    });

    it('preserves nullable credits rather than defaulting them to zero', function () {
        // credits are null on about a tenth of real rows
        expect(sectionByClassNumber(10003)['section']['credits'])->toBeNull();
        expect(sectionByClassNumber(10001)['section']['credits'])->toBe(3);
    });

    it('carries cancellation and crosslist through unchanged', function () {
        $section = sectionByClassNumber(10005)['section'];

        expect($section['is_cancelled'])->toBeTrue();
        expect($section['crosslist'])->toBe('TEST 4001-001/OTHR 4001-001');
        expect(sectionByClassNumber(10001)['section']['is_cancelled'])->toBeFalse();
    });
});
