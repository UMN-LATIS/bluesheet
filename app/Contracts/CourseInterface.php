<?php

namespace App\Contracts;

interface CourseInterface {
    public function getSubject(): string; // "HIST"
    public function getCatalogNumber(): string; // "1001W"
    public function getTitle(): string; // "History of the World"
    public function getCourseCode(): string; // "HIST-1001W"
    public function getCourseType(): string; // "LEC"
    public function getCourseLevel(): string; // "UGRD"
    public function getSource(): string; // "local" or "sis"
    public function getApiId(): string; // "HIST-1001W"
}
