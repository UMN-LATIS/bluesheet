<?php

namespace App\Library\LeavePlanning;

use App\Library\Sis\Crosslist;
use App\Library\TermPlan\TermLock;
use App\LocalClassInstructor;
use App\LocalClassSection;
use App\SisClassInstructor;
use App\SisClassSection;
use Illuminate\Support\Collection;

class TeachingHistory {
    private const INDEPENDENT_STUDY = 'IND';

    /** @return Collection<int, array> by term, course, then section */
    public static function sectionsBetween(int $academicOrg, int $startTermCode, int $endTermCode): Collection {
        $readOnlyTerms = TermLock::readOnlyTermsBetween($academicOrg, $startTermCode, $endTermCode);

        return self::publishedSections($academicOrg, $readOnlyTerms)
            ->concat(self::plannedSections($academicOrg, $startTermCode, $endTermCode, $readOnlyTerms))
            ->sortBy(fn(array $section) => [
                $section['termId'],
                $section['subject'],
                $section['catalogNumber'],
                $section['section'],
            ])
            ->values();
    }

    private static function publishedSections(int $academicOrg, Collection $termCodes): Collection {
        return SisClassSection::query()
            ->where('academic_org', $academicOrg)
            ->whereIn('term_code', $termCodes)
            ->where('is_cancelled', false)
            ->where('component', '!=', self::INDEPENDENT_STUDY)
            ->with('instructors')
            ->get()
            ->map(fn(SisClassSection $section) => [
                ...self::sharedFields($section),
                'career' => $section->academic_career,
                'enrollmentTotal' => $section->enrollment_total,
                'isPlanned' => false,
                'crosslist' => Crosslist::describe($section),
            ]);
    }

    private static function plannedSections(
        int $academicOrg,
        int $startTermCode,
        int $endTermCode,
        Collection $readOnlyTerms,
    ): Collection {
        return LocalClassSection::query()
            ->where('academic_org', $academicOrg)
            ->whereBetween('term_code', [$startTermCode, $endTermCode])
            ->whereNotIn('term_code', $readOnlyTerms)
            ->where('is_cancelled', false)
            ->where('component', '!=', self::INDEPENDENT_STUDY)
            ->with('instructors')
            ->get()
            ->map(fn(LocalClassSection $section) => [
                ...self::sharedFields($section),
                'career' => null,
                'enrollmentTotal' => null,
                'isPlanned' => true,
                'crosslist' => null,
            ]);
    }

    private static function sharedFields(SisClassSection|LocalClassSection $section): array {
        return [
            'key' => self::keyOf($section),
            'termId' => $section->term_code,
            'courseCode' => $section->course_code,
            'subject' => $section->subject,
            'catalogNumber' => $section->catalog_number,
            'section' => $section->class_section,
            'title' => $section->title,
            'component' => $section->component,
            'enrollmentCap' => $section->enrollment_cap,
            'instructors' => $section->instructors
                ->map(fn(SisClassInstructor|LocalClassInstructor $instructor) => [
                    'emplid' => (int) $instructor->emplid,
                    'role' => $instructor->role,
                ])
                ->sortBy(['role', 'emplid'])
                ->values(),
        ];
    }

    /** e.g. "ANTH-1001-003-FA26" */
    private static function keyOf(SisClassSection|LocalClassSection $section): string {
        return "{$section->course_code}-{$section->class_section}-" . TermCodeLabel::of($section->term_code);
    }
}
