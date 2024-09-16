<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use App\Traits\SectionEnrollmentTrait;
use App\Contracts\EnrollmentInterface;

class EnrollmentResource extends JsonResource {
    public function toArray($request) {
        /** @var EnrollmentInterface $enrollment */
        $enrollment = $this->resource;
        return [
            'id' => $enrollment->getApiId(),
            'dbId' => $enrollment->getDBId(),
            'emplid' => $enrollment->getEmplid(),
            'sectionId' => $enrollment->getSectionApiId(),
            'role' => $enrollment->getRole(),
            'source' => $enrollment->getSource(),
        ];
    }
}
