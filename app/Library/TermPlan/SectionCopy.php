<?php

namespace App\Library\TermPlan;

use App\SisClassMeeting;
use App\SisClassSection;
use Illuminate\Support\Collection;

class SectionCopy {
    /** @return array<string, mixed> */
    public static function toColumns(
        SisClassSection $source,
        string $classSection,
        ImportOptions $options,
    ): array {
        return [
            'course_code' => $source->course_code,
            'subject' => $source->subject,
            'catalog_number' => $source->catalog_number,
            'class_section' => $classSection,
            'component' => $source->component,
            'title' => $source->title,
            'credits' => $source->credits,
            'enrollment_cap' => $source->enrollment_cap,
            'delivery' => self::deliveryFromSchedule($source, $options),
            'notes' => null,
            'is_cancelled' => false,
        ];
    }

    /** @return Collection<int, SisClassMeeting> */
    public static function timedMeetings(SisClassSection $source): Collection {
        return $source->meetings
            ->filter(fn(SisClassMeeting $meeting) => MeetingShape::describe($meeting) !== null)
            ->values();
    }

    private static function deliveryFromSchedule(
        SisClassSection $source,
        ImportOptions $options,
    ): string {
        $meetsSomewhere = $options->meetingTimes
            && self::timedMeetings($source)->isNotEmpty();

        return $meetsSomewhere ? 'onCampus' : 'online';
    }
}
