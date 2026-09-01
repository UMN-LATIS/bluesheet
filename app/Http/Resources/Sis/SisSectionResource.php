<?php

namespace App\Http\Resources\Sis;

use App\Library\Sis\Crosslist;
use App\SisClassInstructor;
use App\SisClassMeeting;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Everything the schedule grid needs to draw and label one section, so the
 * client never has to join instructors or employees back onto it.
 */
class SisSectionResource extends JsonResource {
    private const DAY_NAMES = [
        'meets_monday' => 'mon',
        'meets_tuesday' => 'tue',
        'meets_wednesday' => 'wed',
        'meets_thursday' => 'thu',
        'meets_friday' => 'fri',
        'meets_saturday' => 'sat',
        'meets_sunday' => 'sun',
    ];

    public function toArray($request) {
        return [
            'id' => $this->id,
            'classNumber' => $this->class_number,
            'termId' => $this->term_code,
            'courseCode' => $this->course_code,
            'subject' => $this->subject,
            'catalogNumber' => $this->catalog_number,
            'section' => $this->class_section,
            'title' => $this->title,
            'component' => $this->component,
            'credits' => $this->credits,
            'enrollmentCap' => $this->enrollment_cap,
            'enrollmentTotal' => $this->enrollment_total,
            'waitlistCap' => $this->waitlist_cap,
            'waitlistTotal' => $this->waitlist_total,
            'instructors' => $this->instructors->map(self::toInstructor(...))->values(),
            'meetings' => $this->meetings->filter(self::hasTimes(...))->map(self::toMeeting(...))->values(),
            'crosslist' => Crosslist::describe($this->resource),
        ];
    }

    private static function toInstructor(SisClassInstructor $instructor): array {
        return [
            'emplid' => $instructor->emplid,
            'role' => $instructor->role,
            'name' => $instructor->employee?->full_name,
            'internetId' => $instructor->employee?->internet_id,
        ];
    }

    /**
     * A meeting without times cannot be placed on the grid, and an empty
     * `meetings` array is how the client recognizes a section for the
     * no-set-time tray. Passing the row through would give it a second,
     * needless way to reach the same conclusion.
     */
    private static function hasTimes(SisClassMeeting $meeting): bool {
        return $meeting->starts_at !== null && $meeting->ends_at !== null;
    }

    private static function toMeeting(SisClassMeeting $meeting): array {
        return [
            'days' => self::daysMet($meeting),
            'startTime' => self::toClockTime($meeting->starts_at),
            'endTime' => self::toClockTime($meeting->ends_at),
        ];
    }

    /** @return array<string> */
    private static function daysMet(SisClassMeeting $meeting): array {
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
