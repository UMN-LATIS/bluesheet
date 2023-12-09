<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use App\Traits\SectionEnrollmentTrait;

class EnrollmentResource extends JsonResource {

    use SectionEnrollmentTrait;

    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array|\Illuminate\Contracts\Support\Arrayable|\JsonSerializable
     */
    public function sisEnrollmentToArray() {
        return [
            'id' => $this->getEnrollmentId(),
            'dbId' => null,
            'emplId' => $this->INSTRUCTOR_EMPLID,
            'sectionId' => $this->getSectionId(),
            'role' => $this->INSTRUCTOR_ROLE,
        ];
    }

    public function dbEnrollmentToArray() {
        return [
            'id' => $this->getEnrollmentId(),
            'emplId' => $this->user->emplid,
            'sectionId' => $this->getSectionId(),
            'role' => $this->role,
        ];
    }

    public function toArray($request) {
        if ($this->isFromSIS()) {
            return $this->sisEnrollmentToArray();
        }

        return $this->dbEnrollmentToArray();
    }
}
