<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\CourseResource;
use App\Traits\SectionEnrollmentTrait;

class CourseSectionResource extends JsonResource {

    use SectionEnrollmentTrait;
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array|\Illuminate\Contracts\Support\Arrayable|\JsonSerializable
     */
    public function sisSectionToArray($request) {
        return [
            'id' => $this->getSectionId(),
            'classNumber' => $this->CLASS_NUMBER ?? null,
            'dbId' => null,
            'termId' => $this->TERM,
            'courseId' => $this->getCourseId(),
            'classSection' => $this->CLASS_SECTION,
            'enrollmentCap' => $this->ENROLLMENT_CAP,
            'enrollmentTotal' => $this->ENROLLMENT_TOTAL,
            'waitlistCap' => $this->WAITLIST_CAP,
            'waitlistTotal' => $this->WAITLIST_TOTAL,

            'isCancelled' => (bool) $this->CANCELLED,
            'isPublished' => true,
        ];
    }

    // from app db CourseSection model
    public function dbSectionToArray($request) {
        return [
            'id' => $this->getSectionId(),
            'dbId' => $this->id,
            'courseId' => $this->course_id,
            'termId' => $this->term_id,
            'groupId' => $this->group_id,
            'classSection' => $this->class_section,
            'enrollmentCap' => 0,
            'enrollmentTotal' => 0,
            'waitlistCap' => 0,
            'waitlistTotal' => 0,
            'isPublished' => $this->is_published ?? false,
            'isCancelled' => $this->is_cancelled ?? false,
        ];
    }

    public function toArray($request) {
        if ($this->isFromSIS()) {
            return $this->sisSectionToArray($request);
        }
        return $this->dbSectionToArray($request);
    }
}
