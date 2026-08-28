<?php

namespace App\Library\Sis;

use App\SisClassMeeting;
use Illuminate\Support\Collection;

/**
 * Turns Bandaid's class list into the three shapes the sis_ tables hold.
 *
 * Bandaid returns one row per class per instructor per meeting pattern, so a
 * single section arrives as several rows that differ only in who teaches it and
 * when it meets. This class does the splitting. It performs no I/O, which is
 * what makes it worth testing directly.
 */
class ClassRecordTransformer {
    /** A time of exactly midnight is how the SIS says "this section never meets". */
    private const NEVER_MEETS = '00:00:00';

    /**
     * A departmental proxy is listed as instructor of record on many sections at
     * once, so keeping the role would report every proxy as double-booked with
     * itself. Dropping it here means a handful of independent-study sections show
     * no instructor, which is the accepted trade.
     */
    private const IGNORED_ROLE = 'PRXY';

    /** Bandaid's day flags, in the order the sis_class_meetings columns expect. */
    private const DAY_FIELDS = ['MON', 'TUES', 'WED', 'THURS', 'FRI', 'SAT', 'SUN'];

    /**
     * @param iterable<object|array> $classRecords raw records from Bandaid
     * @return Collection<array{section: array, instructors: array[], meetings: array[]}>
     */
    public function transform(iterable $classRecords): Collection {
        return collect($classRecords)
            ->map(fn($record) => (array) $record)
            // A section is identified by term and class number. Every other
            // section-level field is constant across the rows that share this
            // pair, so taking them from the first row is safe.
            ->groupBy(fn(array $r) => $r['TERM'] . '-' . $r['CLASS_NUMBER'])
            ->map(fn(Collection $rows) => [
                'section' => $this->toSection($rows->first()),
                'instructors' => $this->toInstructors($rows),
                'meetings' => $this->toMeetings($rows),
            ])
            ->values();
    }

    private function toSection(array $record): array {
        return [
            'term_code' => $record['TERM'],
            'class_number' => $record['CLASS_NUMBER'],
            'academic_org' => $record['ACADEMIC_ORG'],
            'institution' => $record['INSTITUTION'],
            'subject' => $record['SUBJECT'],
            'catalog_number' => $record['CATALOG_NUMBER'],
            'class_section' => $record['CLASS_SECTION'],
            'component' => $record['COMPONENT_CLASS'],
            'academic_career' => $record['ACADEMIC_CAREER'],
            'title' => $record['DESCRIPTION'],
            'credits' => $record['ACADEMIC_PROGRESS_CREDITS'] ?? null,
            'enrollment_cap' => $record['ENROLLMENT_CAP'] ?? 0,
            'enrollment_total' => $record['ENROLLMENT_TOTAL'] ?? 0,
            'waitlist_cap' => $record['WAITLIST_CAP'] ?? 0,
            'waitlist_total' => $record['WAITLIST_TOTAL'] ?? 0,
            'is_cancelled' => (bool) ($record['CANCELLED'] ?? 0),
            'crosslist' => $record['COURSE_CROSSLIST'] ?? null,
        ];
    }

    /** @param Collection<array> $rows */
    private function toInstructors(Collection $rows): array {
        return $rows
            ->filter(fn(array $r) => $r['INSTRUCTOR_EMPLID'] && $r['INSTRUCTOR_ROLE'] !== self::IGNORED_ROLE)
            ->map(fn(array $r) => [
                'emplid' => $r['INSTRUCTOR_EMPLID'],
                'role' => $r['INSTRUCTOR_ROLE'],
            ])
            ->unique(fn(array $i) => $i['emplid'] . '-' . $i['role'])
            ->values()
            ->all();
    }

    /**
     * Rows sharing a time range are one meeting, not several. The SIS splits a
     * MWF class into an "MW" row and an "F" row, and sometimes emits an "MW" row
     * alongside a redundant "W" one. Combining day flags within a time range
     * resolves both without having to tell them apart. Rows with genuinely
     * different times, such as a MWF lecture plus a Thursday evening session,
     * stay separate.
     *
     * @param Collection<array> $rows
     */
    private function toMeetings(Collection $rows): array {
        return $rows
            ->filter(fn(array $r) => $r['TIME_START'] && $r['TIME_START'] !== self::NEVER_MEETS)
            ->groupBy(fn(array $r) => $r['TIME_START'] . '-' . $r['TIME_END'])
            ->map(function (Collection $sameTime) {
                $first = $sameTime->first();

                $days = [];
                foreach (self::DAY_FIELDS as $index => $field) {
                    $days[SisClassMeeting::DAY_COLUMNS[$index]] = $sameTime->contains(fn(array $r) => (bool) $r[$field]);
                }

                return [
                    'starts_at' => $first['TIME_START'],
                    'ends_at' => $first['TIME_END'],
                    ...$days,
                ];
            })
            ->values()
            ->all();
    }
}
