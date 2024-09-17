<?php

namespace App\DTOs;

use App\Contracts\CourseInterface;
use App\Contracts\CourseSectionInterface;

class SISCourseSectionDTO implements CourseSectionInterface {
    private SISCourseDTO $course;
    private int $termId;
    private string $classSection;
    private int $enrollmentCap;
    private int $enrollmentTotal;
    private int $waitlistCap;
    private int $waitlistTotal;
    private bool $isCancelled;
    private bool $isPublished;

    /**
     *
     * @param object{
     *   id: int,
     *   TERM: int,
     *   INSTRUCTOR_EMPLID: int,
     *   ACADEMIC_ORG: int,
     *   SUBJECT: string,
     *   CLASS_SECTION: string,
     *   INSTRUCTOR_ROLE: string,
     *   CATALOG_NUMBER: string,
     *   CLASS_NUMBER: int,
     *   ACADEMIC_CAREER: string,
     *   DESCRIPTION: string,
     *   COMPONENT_CLASS: string,
     *   ENROLLMENT_CAP: int,
     *   ENROLLMENT_TOTAL: int,
     *   WAITLIST_CAP: int,
     *   WAITLIST_TOTAL: int,
     *   CANCELLED: int,
     *   ENROLLMENTS: array
     * } $rawClassData - The raw class data from the SIS
     * @return void
     */
    public function __construct($rawClassData) {
        $this->course = new SISCourseDTO($rawClassData);
        $this->termId = $rawClassData->TERM;
        $this->classSection = $rawClassData->CLASS_SECTION;
        $this->enrollmentCap = $rawClassData->ENROLLMENT_CAP;
        $this->enrollmentTotal = $rawClassData->ENROLLMENT_TOTAL;
        $this->waitlistCap = $rawClassData->WAITLIST_CAP;
        $this->waitlistTotal = $rawClassData->WAITLIST_TOTAL;
        $this->isCancelled = $rawClassData->CANCELLED === 1;
        $this->isPublished = true;
    }

    public function getApiId(): string {
        return join('-',[
            $this->course->getApiId(),
            $this->classSection,
            $this->termId
        ]);
    }

    public function getDBId(): int | null {
        // not stored in the local db
        return null;
    }

    public function getTermId(): int {
        return $this->termId;
    }

    public function getClassSection(): string
    {
        return $this->classSection;
    }

    public function getEnrollmentCap(): int
    {
        return $this->enrollmentCap;
    }

    public function getEnrollmentTotal(): int
    {
        return $this->enrollmentTotal;
    }

    public function getWaitlistCap(): int
    {
        return $this->waitlistCap;
    }

    public function getWaitlistTotal(): int
    {
        return $this->waitlistTotal;
    }

    public function isCancelled(): bool
    {
        return $this->isCancelled;
    }

    public function isPublished(): bool
    {
        return $this->isPublished;
    }

    public function getCourseApiId(): string
    {
        return $this->course->getApiId();
    }

    public function getSource(): string
    {
        return 'sis';
    }
}
