<?php

use App\Library\TermPlan\SectionCopy;
use App\SisClassMeeting;
use App\SisClassSection;

function sourceSection(array $meetings = [], array $attributes = []): SisClassSection {
    $section = new SisClassSection([
        'course_code' => 'ANTH-1001',
        'subject' => 'ANTH',
        'catalog_number' => '1001',
        'class_section' => '009',
        'component' => 'LEC',
        'title' => 'Human Evolution',
        'credits' => 3,
        'enrollment_cap' => 120,
        'is_cancelled' => false,
        ...$attributes,
    ]);

    return $section->setRelation('meetings', collect($meetings));
}

function sourceMeeting(?string $startsAt, ?string $endsAt): SisClassMeeting {
    return new SisClassMeeting([
        'starts_at' => $startsAt,
        'ends_at' => $endsAt,
        'meets_monday' => true,
    ]);
}

describe('SectionCopy', function () {
    it('takes the number it is given rather than the source number', function () {
        $columns = SectionCopy::toColumns(sourceSection(), '018');

        expect($columns['class_section'])->toBe('018');
    });

    it('copies the course, the title and the cap', function () {
        $columns = SectionCopy::toColumns(sourceSection(), '009');

        expect($columns)->toMatchArray([
            'course_code' => 'ANTH-1001',
            'subject' => 'ANTH',
            'catalog_number' => '1001',
            'component' => 'LEC',
            'title' => 'Human Evolution',
            'credits' => 3,
            'enrollment_cap' => 120,
        ]);
    });

    it('arrives online when the section meets at no time', function () {
        $columns = SectionCopy::toColumns(sourceSection(), '009');

        expect($columns['delivery'])->toBe('online');
    });

    it('arrives on campus when the section has a meeting time', function () {
        $section = sourceSection([sourceMeeting('10:10:00', '11:00:00')]);

        expect(SectionCopy::toColumns($section, '009')['delivery'])->toBe('onCampus');
    });

    it('arrives online when a meeting row carries no times', function () {
        $section = sourceSection([sourceMeeting(null, null)]);

        expect(SectionCopy::toColumns($section, '009')['delivery'])->toBe('online');
        expect(SectionCopy::timedMeetings($section))->toHaveCount(0);
    });

    it('starts with no notes and not cancelled', function () {
        $columns = SectionCopy::toColumns(sourceSection(), '009');

        expect($columns['notes'])->toBeNull();
        expect($columns['is_cancelled'])->toBeFalse();
    });
});
