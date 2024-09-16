<?php

namespace App\Contracts;

interface EnrollmentInterface {
    public function getApiId(): string;
    public function getDBId(): int | null;
    public function getEmplid(): string;
    public function getSectionApiId(): string;
    public function getRole(): string;
    public function getSource(): string;
}
