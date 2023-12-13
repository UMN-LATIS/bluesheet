<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use App\Traits\SectionEnrollmentTrait;

class EnrollmentResource extends JsonResource {

    use SectionEnrollmentTrait;

    /**
     * get the enrollment id for a sis enrollment
     */
    protected function getSISEnrollmentId(): string {
        // sis enrollments will not have a defined
        // id (since it's not stored in the db)
        // so create one based on the section id
        // and instructor emplid
        return join('-', [
            'sis',
            $this->getSectionId(),
            $this->INSTRUCTOR_EMPLID,
        ]);
    }

    /**
     * Get the enrollment ID for a DB enrollment.
     */
    protected function getDBEnrollmentId(): string {
        // enrollments from db will have a defined id
        // so prefix it with `db` to distinguish it from
        // sis enrollments
        return join('-', [
            'db',
            $this->id,
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
            'id' => $this->getSISEnrollmentId(),
            'dbId' => null,
            'emplid' => $this->INSTRUCTOR_EMPLID,
            'sectionId' => $this->getSectionId(),
            'role' => $this->INSTRUCTOR_ROLE,
        ];
    }

    public function dbEnrollmentToArray() {
        return [
            'id' => $this->getDBEnrollmentId(),
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
