<?php

namespace App\DTOs;

use App\Contracts\CourseInterface;

class SISCourseDTO implements CourseInterface {

    public string $SUBJECT;
    public string $CATALOG_NUMBER;
    public string $DESCRIPTION;
    public string $COMPONENT_CLASS;
    public string $ACADEMIC_CAREER;

    /**
     * create a new SISCourseDTO instance.
     *
     *  @param object{
     *     SUBJECT: string,
     *     CATALOG_NUMBER: string,
     *     DESCRIPTION: string,
     *     COMPONENT_CLASS: string,
     *     ACADEMIC_CAREER: string,
     * } $course An associative array with course data.
     */
    public function __construct($course) {
        $this->SUBJECT = $course->SUBJECT;
        $this->CATALOG_NUMBER = $course->CATALOG_NUMBER;
        $this->DESCRIPTION = $course->DESCRIPTION;
        $this->COMPONENT_CLASS = $course->COMPONENT_CLASS ?? 'Unknown';
        $this->ACADEMIC_CAREER = $course->ACADEMIC_CAREER;
    }

    public function getSubject(): string
    {
        return $this->SUBJECT;
    }

    public function getCatalogNumber(): string
    {
        return $this->CATALOG_NUMBER;
    }

    public function getTitle(): string
    {
        return $this->DESCRIPTION;
    }

    public function getCourseCode(): string
    {
        return $this->SUBJECT . '-' . $this->CATALOG_NUMBER;
    }

    public function getCourseType(): string
    {
        return $this->COMPONENT_CLASS;
    }

    public function getCourseLevel(): string
    {
        return $this->ACADEMIC_CAREER;
    }

    public function getSource(): string
    {
        return 'sis';
    }

    public function getApiId(): string
    {
        return $this->getCourseCode();
    }
}
