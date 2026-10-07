<?php

namespace App\Library\TermPlan;

use App\SisClassInstructor;
use App\SisClassSection;
use Illuminate\Support\Collection;

final class EnrollmentHistory {
    private const TERM_COUNT = 8;

    private const LEAD_ROLE = 'PI';

    public static function before(int $academicOrg, int $termCode): array {
        $termCodes = self::fallAndSpringTermsBefore($academicOrg, $termCode);

        $sections = SisClassSection::query()
            ->where('academic_org', $academicOrg)
            ->whereIn('term_code', $termCodes)
            ->where('is_cancelled', false)
            ->with([
                'instructors' => fn($instructors) => $instructors->orderBy('emplid'),
                'instructors.employee',
                'meetings',
            ])
            ->orderBy('course_code')
            ->orderBy('class_section')
            ->orderBy('term_code')
            ->get();

        return [
            'termCodes' => $termCodes->all(),
            'sections' => $sections->map(fn(SisClassSection $section) => [
                'courseCode' => $section->course_code,
                'section' => $section->class_section,
                'termCode' => $section->term_code,
                'enrollmentTotal' => $section->enrollment_total,
                'enrollmentCap' => $section->enrollment_cap,
                'waitlistTotal' => $section->waitlist_total,
                'leadInstructorLastName' => self::leadInstructorLastName($section),
                'meetings' => $section->meetings->map(MeetingShape::describe(...))->filter()->values()->all(),
            ])->all(),
        ];
    }

    private static function leadInstructorLastName(SisClassSection $section): ?string {
        $lead = $section->instructors->first(
            fn(SisClassInstructor $instructor) => $instructor->role === self::LEAD_ROLE
        );

        return $lead?->employee?->last_name;
    }

    /** @return Collection<int, int> oldest first */
    private static function fallAndSpringTermsBefore(int $academicOrg, int $termCode): Collection {
        $latestTerms = SisClassSection::query()
            ->where('academic_org', $academicOrg)
            ->where('term_code', '<', $termCode)
            ->distinct()
            ->pluck('term_code')
            ->filter(self::isFallOrSpring(...))
            ->sortDesc()
            ->take(self::TERM_COUNT);

        return $latestTerms->sort()->values();
    }

    private static function isFallOrSpring(int $termCode): bool {
        return in_array(Season::tryOfTerm($termCode), [Season::Fall, Season::Spring], true);
    }
}
