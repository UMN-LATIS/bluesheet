<?php

namespace App\Http\Resources\Sis;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A course as it stays constant from term to term, wrapping one section
 * chosen to represent it. See GroupCourseController for how that section
 * is picked.
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
