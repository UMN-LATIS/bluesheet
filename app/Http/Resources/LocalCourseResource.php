<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class LocalCourseResource extends JsonResource {
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array|\Illuminate\Contracts\Support\Arrayable|\JsonSerializable
     */
    public function toArray($request) {
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
}
