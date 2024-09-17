<?php

namespace App\Traits;

/**
 * Helper methods for CourseSectionResource and EnrollmentResource
 * so that we can relate sections to enrollments
 */
trait SectionEnrollmentTrait {

    protected function isFromSIS(): bool {
        return (bool) $this->CLASS_NUMBER;
    }

    protected function getSectionId() {
        if ($this->isFromSIS()) {
            return join('-', [
                'sis',
                $this->getCourseId(),
                $this->CLASS_SECTION,
                $this->TERM,
            ]);
        }

        return join('-', [
            'db',
            $this->course_section_id ?? $this->id,
            $this->TERM,
        ]);
    }

    protected function getCourseId() {
        return join('-', [
            $this->SUBJECT,
            $this->CATALOG_NUMBER
        ]);
    }
}
