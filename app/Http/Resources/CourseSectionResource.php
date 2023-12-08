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
    public function toArray($request) {
        return [
            'id' => $this->getSectionId(),
            'classNumber' => $this->CLASS_NUMBER ?? null,
            'unpublishedSectionId' => $this->unpublishedSectionId ?? null,
            'termId' => $this->TERM,
            'courseId' => $this->getCourseId(),
            'classSection' => $this->CLASS_SECTION,
            'enrollmentCap' => $this->ENROLLMENT_CAP,
            'enrollmentTotal' => $this->ENROLLMENT_TOTAL,
            'waitlistCap' => $this->WAITLIST_CAP,
            'waitlistTotal' => $this->WAITLIST_TOTAL,
            'enrollments' => $this->ENROLLMENTS,
            'isCancelled' => (bool) $this->CANCELLED,
            'isPublished' => $this->getIsSectionPublished(),
            // 'course' => $this->COURSE,
        ];
    }
}
