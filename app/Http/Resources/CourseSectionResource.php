<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use App\Contracts\CourseSectionInterface;

class CourseSectionResource extends JsonResource {
    public function toArray($request) {
        /** @var CourseSectionInterface $section */
        $section = $this->resource;

        return [
            'id' => $section->getApiId(),
            'dbId' => $section->getDBId(),
            'courseId' => $section->getCourseApiId(),
            'termId' => $section->getTermId(),
            'classSection' => $section->getClassSection(),
            'enrollmentCap' => $section->getEnrollmentCap(),
            'enrollmentTotal' => $section->getEnrollmentTotal(),
            'waitlistCap' => $section->getWaitlistCap(),
            'waitlistTotal' => $section->getWaitlistTotal(),
            'isPublished' => $section->isPublished(),
            'isCancelled' => $section->isCancelled(),
            'source' => $section->getSource(),
        ];
    }
}
