<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class CourseResource extends JsonResource {
    public function toArray($request) {
        /** @var CourseInterface $course */
        $course = $this->resource;

        return [
            'id' => $course->getApiId(),
            'subject' => $course->getSubject(),
            'catalogNumber' => $course->getCatalogNumber(),
            'title' => $course->getTitle(),
            'courseType' => $course->getCourseType(),
            'courseLevel' => $course->getCourseLevel(),
            'courseCode' => $course->getCourseCode(),
            'source' => $course->getSource(),
        ];
    }
}
