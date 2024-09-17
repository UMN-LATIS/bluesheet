<?php

namespace App\Contracts;

interface CourseSectionInterface {
    public function getApiId(): string;
    public function getCourseApiId(): string;
    public function getDBId(): int | null;
    public function getTermId(): int;
    public function getClassSection(): string;
    public function getEnrollmentCap(): int;
    public function getEnrollmentTotal(): int;
    public function getWaitlistCap(): int;
    public function getWaitlistTotal(): int;
    public function isCancelled(): bool;
    public function isPublished(): bool;
    public function getSource(): string;
}
