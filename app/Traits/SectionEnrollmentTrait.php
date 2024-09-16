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
        $prefix = $this->isFromSIS() ? 'sis' : 'db';
        return join('-', [
            $prefix,
            $this->getCourseId(),
            $this->CLASS_SECTION,
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
