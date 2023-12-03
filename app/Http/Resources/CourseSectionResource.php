<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use App\Library\Utilities;

class CourseSectionResource extends JsonResource {
    protected function getSectionStatus() {
        return $this->CANCELLED ? 'cancelled' : 'active';
    }

    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array|\Illuminate\Contracts\Support\Arrayable|\JsonSerializable
     */
    public function toArray($request) {
        return [
            'id' => $this->CLASS_NUMBER,
            'termId' => $this->TERM,
            // 'deptId' => $this->ACADEMIC_ORG,
            'courseId' => join('-', [$this->SUBJECT, $this->CATALOG_NUMBER]),
            'subject' => $this->SUBJECT, // "HIST"
            'catalogNumber' => $this->CATALOG_NUMBER, // "1001W"
            'classSection' => $this->CLASS_SECTION, // "001"
            'title' => $this->DESCRIPTION,
            'courseType' => Utilities::trimWithFallback($this->COMPONENT_CLASS), // "LEC"
            "courseLevel" => Utilities::trimWithFallback($this->ACADEMIC_CAREER), // "UGRD"
            'enrollmentCap' => $this->ENROLLMENT_CAP,
            'enrollmentTotal' => $this->ENROLLMENT_TOTAL,
            'waitlistCap' => $this->WAITLIST_CAP,
            'waitlistTotal' => $this->WAITLIST_TOTAL,
            'status' => $this->getSectionStatus($request),
        ];
    }
}