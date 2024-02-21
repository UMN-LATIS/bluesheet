<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use App\Library\Utilities;

class CourseResource extends JsonResource {
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array|\Illuminate\Contracts\Support\Arrayable|\JsonSerializable
     */
    protected function sisCourseToArray() {
        return [
            'id' => $this->courseCode,
            'subject' => $this->SUBJECT, // "HIST"
            'catalogNumber' => $this->CATALOG_NUMBER, // "1001W"
            'title' => $this->DESCRIPTION,
            'courseType' => Utilities::trimWithFallback($this->COMPONENT_CLASS), // "LEC"
            "courseLevel" => Utilities::trimWithFallback($this->ACADEMIC_CAREER), // "UGRD"
            "courseCode" => $this->courseCode,
            'source' => 'sis',
        ];
    }

    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array|\Illuminate\Contracts\Support\Arrayable|\JsonSerializable
     */
    protected function localCourseToArray() {
        return [
            'id' => $this->courseCode,
            'subject' => $this->subject,
            'catalogNumber' => $this->catalog_number,
            'title' => $this->title,
            'courseType' => $this->type,
            'courseLevel' => $this->level,
            'courseCode' => $this->courseCode,
            'source' => 'local',
        ];
    }

    public function toArray($request) {
        if ($this->source === 'local') {
            return $this->localCourseToArray();
        }

        if ($this->source === 'sis') {
            return $this->sisCourseToArray();
        }

        throw new \Exception('Invalid source');
    }
}
