<?php

namespace App\Http\Resources\Sis;

use Illuminate\Http\Resources\Json\JsonResource;

/** A roster entry, read off the appointment that placed the person there. */
class SisEmployeeResource extends JsonResource {
    public function toArray($request) {
        return [
            'emplid' => $this->emplid,
            'name' => $this->employee?->full_name,
            'firstName' => $this->employee?->first_name,
            'lastName' => $this->employee?->last_name,
            'internetId' => $this->employee?->internet_id,
            'positionTitle' => $this->position_desc,
            'category' => $this->category,
        ];
    }
}
