<?php

namespace App\Http\Resources\Sis;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A course, read off the one section chosen to represent it (see
 * GroupCourseController).
 */
class SisCourseResource extends JsonResource {
    public function toArray($request) {
        return [
            'id' => $this->course_code . '-' . $this->component,
            'courseCode' => $this->course_code,
            'subject' => $this->subject,
            'catalogNumber' => $this->catalog_number,
            'title' => $this->title,
            'component' => $this->component,
            'credits' => $this->credits,
            'lastOfferedTermId' => $this->term_code,
        ];
    }
}
