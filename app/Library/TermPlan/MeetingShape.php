<?php

namespace App\Library\TermPlan;

/**
 * One meeting pattern as the grid reads it.
 *
 * SIS meetings and planned meetings carry identical columns, and the grid must
 * not be able to tell which it was handed, so both resources describe a
 * meeting through here rather than each formatting days and times its own way.
 */
class MeetingShape {
    private const DAY_NAMES = [
        'meets_monday' => 'mon',
        'meets_tuesday' => 'tue',
        'meets_wednesday' => 'wed',
        'meets_thursday' => 'thu',
        'meets_friday' => 'fri',
        'meets_saturday' => 'sat',
        'meets_sunday' => 'sun',
    ];

    /**
     * Null when the meeting has no set time, which is how a section ends up
     * with an empty `meetings` array: that emptiness is the client's only
     * sign that a section is asynchronous.
     *
     * @return array{days: string[], startTime: string, endTime: string}|null
     */
    public static function describe(object $meeting): ?array {
        if ($meeting->starts_at === null || $meeting->ends_at === null) {
            return null;
        }

        return [
            'days' => self::daysMet($meeting),
            'startTime' => self::toClockTime($meeting->starts_at),
            'endTime' => self::toClockTime($meeting->ends_at),
        ];
    }

    /**
     * The inverse: the day columns a row needs to meet on the given days.
     * Kept here so the mapping between "mon" and meets_monday is written once.
     *
     * @param array<string> $days
     * @return array<string, bool>
     */
    public static function toDayColumns(array $days): array {
        // array_map keeps the keys of a single array, so the column names
        // stay the keys and each becomes true or false
        return array_map(fn(string $day) => in_array($day, $days, true), self::DAY_NAMES);
    }

    /** @return array<string> */
    private static function daysMet(object $meeting): array {
        return array_values(array_filter(
            self::DAY_NAMES,
            fn(string $column) => $meeting->$column,
            ARRAY_FILTER_USE_KEY,
        ));
    }

    /** Database times arrive as `10:10:00`; the grid wants `10:10`. */
    private static function toClockTime(string $time): string {
        return substr($time, 0, 5);
    }
}
