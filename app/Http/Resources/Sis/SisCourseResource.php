<?php

namespace App\Http\Resources\Sis;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A course, independent of any term. Component is deliberately absent: within
 * a term every component of a course reports the same title and credits, so a
 * lecture and its lab are one course here rather than two.
 */
class SisCourseResource extends JsonResource {
    public function toArray($request) {
        return [
            'id' => $this->course_code,
            'courseCode' => $this->course_code,
            'subject' => $this->subject,
            'catalogNumber' => $this->catalog_number,
            'title' => $this->title,
            'credits' => $this->credits,
            'lastOfferedTermId' => $this->last_offered_term_code,
        ];
    }
}
