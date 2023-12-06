<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use App\Library\Utilities;

class CourseWithInstructors extends JsonResource {
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array|\Illuminate\Contracts\Support\Arrayable|\JsonSerializable
     */
    public function toArray($request) {
        return [
            'id' => $this->id,
            'term' => $this->TERM,
            "title" => $this->DESCRIPTION,
            'subject' => $this->SUBJECT,
            'catalogNumber' => $this->CATALOG_NUMBER,
            'classNumber' => $this->CLASS_NUMBER,
            'classSection' => $this->CLASS_SECTION,
            "enrollmentCap" => $this->ENROLLMENT_CAP,
            "enrollmentTotal" => $this->ENROLLMENT_TOTAL,
            "instructorRole" => $this->INSTRUCTOR_ROLE,
            "cancelled" => (bool) $this->CANCELLED,
            "courseType" => Utilities::trimWithFallback($this->COMPONENT_CLASS),
            "courseLevel" => Utilities::trimWithFallback($this->ACADEMIC_CAREER),
            "instructor" => $this->when($this->instructor, new PersonResource($this->instructor), null),
        ];
    }
}
