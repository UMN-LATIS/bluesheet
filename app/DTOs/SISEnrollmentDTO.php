<?php

namespace App\DTOs;

use App\Contracts\CourseSectionInterface;
use App\Contracts\EnrollmentInterface;

class SISEnrollmentDTO implements EnrollmentInterface {
    private CourseSectionInterface $section;
    private string $emplid;
    private string $role;

    /**
     * The raw enrollment data from the SIS API
     *
     * @param <object{
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
     *   COURSE_CROSSLIST: mixed
     * }> $data
     */
    public function __construct($data) {
        $this->section = new SISCourseSectionDTO($data);
        $this->emplid = $data->INSTRUCTOR_EMPLID;
        $this->role = $data->INSTRUCTOR_ROLE;
    }

    public function getApiId(): string {
        return join('_',[
            $this->emplid,
            $this->getSectionApiId(),
        ]);
    }

    public function getDBId(): ?int
    {
        return null;
    }

    public function getEmplid(): int
    {
        return $this->emplid;
    }

    public function getSectionApiId(): string
    {
        return $this->section->getApiId();
    }

    public function getRole(): string
    {
        return $this->role;
    }

    public function getSource(): string
    {
        return 'sis';
    }

    public function getSectionDBId(): ?int
    {
        return null;
    }
}
