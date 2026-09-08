<?php

namespace App\Http\Resources\Sis;

use App\Library\Sis\Crosslist;
use App\Library\TermPlan\MeetingShape;
use App\SisClassInstructor;
use Illuminate\Http\Resources\Json\JsonResource;

class SisSectionResource extends JsonResource {
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
            'meetings' => $this->meetings->map(MeetingShape::describe(...))->filter()->values(),
            'crosslist' => Crosslist::describe($this->resource),
        ];
    }

    private static function toInstructor(SisClassInstructor $instructor): array {
        return [
            'emplid' => $instructor->emplid,
            'role' => $instructor->role,
            'name' => $instructor->employee?->full_name,
            // sent separately: a client cannot
            // split "de la Cruz" out of a full name
            'lastName' => $instructor->employee?->last_name,
            'internetId' => $instructor->employee?->internet_id,
        ];
    }
}
