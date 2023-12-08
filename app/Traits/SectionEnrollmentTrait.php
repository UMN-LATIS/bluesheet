<?php

namespace App\Traits;

/**
 * Helper methods for CourseSectionResource and EnrollmentResource
 * so that we can relate sections to enrollments
 */
trait SectionEnrollmentTrait {

    protected function getIsSectionPublished(): bool {
        return (bool) $this->CLASS_NUMBER;
    }

    protected function getSectionId() {
        $prefix = $this->getIsSectionPublished() ? 'published' : 'unpublished';
        return join('-', [$prefix, $this->CLASS_NUMBER ?? $this->unpublishedSectionId]);
    }

    protected function getEnrollmentId() {
        return join('-', [
            $this->getSectionId(),
            $this->INSTRUCTOR_EMPLID,
        ]);
    }

    protected function getCourseId() {
        return join('-', [
            $this->SUBJECT,
            $this->CATALOG_NUMBER
        ]);
    }
}
