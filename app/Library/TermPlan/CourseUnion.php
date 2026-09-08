<?php

namespace App\Library\TermPlan;

use App\LocalCourse;
use App\SisCourse;
use Illuminate\Support\Collection;

/**
 * The courses a department can plan against: the catalogue the SIS knows,
 * plus the ones a scheduler named because the SIS does not know them yet.
 *
 * Where both hold the same course code the SIS row wins, because the registrar
 * publishing a course is what makes the locally named one redundant. Each row
 * says which side it came from, so the picker can mark the unofficial ones.
 *
 * Note this is the opposite of the old course planner, whose
 * CoursePlanning\GroupCourseController concatenates local first and so lets
 * local win. That was the right call when local rows were the only plan there
 * was; here the SIS is the record as soon as it has one.
 */
class CourseUnion {
    /**
     * @param Collection<int, SisCourse> $sisCourses
     * @param Collection<int, LocalCourse> $localCourses
     * @return Collection<int, array>
     */
    public static function of(Collection $sisCourses, Collection $localCourses): Collection {
        return $sisCourses
            ->map(self::fromSis(...))
            ->concat($localCourses->map(self::fromLocal(...)))
            // `unique` keeps the first it sees, and the SIS rows came first
            ->unique('courseCode')
            ->sortBy([['subject', 'asc'], ['catalogNumber', 'asc']])
            ->values();
    }

    private static function fromSis(SisCourse $course): array {
        return [
            'id' => $course->course_code,
            'courseCode' => $course->course_code,
            'subject' => $course->subject,
            'catalogNumber' => $course->catalog_number,
            'title' => $course->title,
            'credits' => $course->credits,
            'lastOfferedTermId' => $course->last_offered_term_code,
            'source' => 'sis',
        ];
    }

    private static function fromLocal(LocalCourse $course): array {
        return [
            'id' => $course->course_code,
            'courseCode' => $course->course_code,
            'subject' => $course->subject,
            'catalogNumber' => $course->catalog_number,
            'title' => $course->title,
            'credits' => $course->credits,
            // nobody has offered it, which is why it is here at all
            'lastOfferedTermId' => null,
            'source' => 'local',
        ];
    }
}
