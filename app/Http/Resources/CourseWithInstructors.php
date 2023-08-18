<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\User;

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
            'subject' => $this->SUBJECT,
            'catalog_number' => $this->CATALOG_NUMBER,
            'class_number' => $this->CLASS_NUMBER,
            "description" => $this->DESCRIPTION,
            "enrollment_cap" => $this->ENROLLMENT_CAP,
            "enrollment_total" => $this->ENROLLMENT_TOTAL,
            "cancelled" => (bool) $this->CANCELLED,
            "instructor" => $this->instructor ? [
                'id' => $this->instructor->id,
                'givenname' => $this->instructor->givenname,
                'surname' => $this->instructor->surname,
                'displayName' => $this->instructor->displayName,
                'email' => $this->instructor->email,
                'leaves' => $this->when($this->instructor->leaves->isNotEmpty(), $this->instructor->leaves)
            ] : null,
        ];
    }
}
