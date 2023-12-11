<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use App\Traits\SectionEnrollmentTrait;

class EnrollmentResource extends JsonResource {

    use SectionEnrollmentTrait;

    protected function getEnrollmentId() {
        return join('-', [
            $this->getSectionId(),
            $this->INSTRUCTOR_EMPLID ?? $this->user->emplid,
        ]);
    }

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
            'emplid' => $this->INSTRUCTOR_EMPLID,
            'sectionId' => $this->getSectionId(),
            'role' => $this->INSTRUCTOR_ROLE,
        ];
    }

    public function dbEnrollmentToArray() {
        return [
            'id' => $this->getEnrollmentId(),
            'dbId' => $this->id,
            'emplid' => $this->user->emplid,
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
