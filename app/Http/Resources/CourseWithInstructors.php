<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

function trimWithFallback($string, $default = 'Unspecified') {
    if (!is_string($string)) return $default;
    $trimmedString = trim($string);
    return $trimmedString ? $trimmedString : $default;
}

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
            "courseType" => trimWithFallback($this->COMPONENT_CLASS),
            "courseLevel" => trimWithFallback($this->ACADEMIC_CAREER),
            "instructor" => $this->instructor ? [
                'id' => $this->instructor->id,
                'givenName' => $this->instructor->givenname,
                'surName' => $this->instructor->surname,
                'displayName' => $this->instructor->displayName,
                'email' => $this->instructor->email,
                'leaves' => $this->when($this->instructor->leaves->isNotEmpty(), $this->instructor->leaves),
                'academicAppointment' => trimWithFallback($this->instructor->jobCategory),
                'emplid' => $this->instructor->emplid,
            ] : null,
        ];
    }
}
