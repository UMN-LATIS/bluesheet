<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use App\Library\Utilities;

class SISCourseResource extends JsonResource {
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array|\Illuminate\Contracts\Support\Arrayable|\JsonSerializable
     */
    public function toArray($request) {
        return [
            'id' => $this->shortCode,
            'subject' => $this->SUBJECT, // "HIST"
            'catalogNumber' => $this->CATALOG_NUMBER, // "1001W"
            'title' => $this->DESCRIPTION,
            'courseType' => Utilities::trimWithFallback($this->COMPONENT_CLASS), // "LEC"
            "courseLevel" => Utilities::trimWithFallback($this->ACADEMIC_CAREER), // "UGRD"
        ];
    }
}
