<?php

namespace App\Http\Resources\TermPlanning;

use App\Library\TermPlan\MeetingShape;
use App\LocalClassInstructor;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A planned section in the shape the grid already reads, so the page renders
 * a term the schedulers own the same way it renders one the SIS owns.
 *
 * The enrollment and waitlist totals are the exception, and they are zero
 * rather than absent: nobody has registered for a section the registrar has
 * never published, and dropping the keys would make the grid tell the two
 * kinds of term apart.
 */
class LocalSectionResource extends JsonResource {
    public function toArray($request) {
        return [
            'id' => $this->id,
            // the SIS assigns class numbers, and it has not seen this section
            'classNumber' => null,
            'termId' => $this->term_code,
            'courseCode' => $this->course_code,
            'subject' => $this->subject,
            'catalogNumber' => $this->catalog_number,
            'section' => $this->class_section,
            'title' => $this->title,
            'component' => $this->component,
            'credits' => $this->credits,
            'enrollmentCap' => $this->enrollment_cap,
            'enrollmentTotal' => 0,
            'waitlistCap' => 0,
            'waitlistTotal' => 0,
            'instructors' => $this->instructors->map(self::toInstructor(...))->values(),
            'meetings' => $this->meetings->map(MeetingShape::describe(...))->filter()->values(),
            // the SIS decides cross-listings, so a planned section has none
            'crosslist' => null,
            'delivery' => $this->delivery,
            'notes' => $this->notes ?? '',
            'isCancelled' => $this->is_cancelled,
        ];
    }

    private static function toInstructor(LocalClassInstructor $instructor): array {
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
