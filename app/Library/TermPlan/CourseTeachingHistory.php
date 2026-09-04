<?php

namespace App\Library\TermPlan;

use App\LocalClassInstructor;
use App\SisClassInstructor;
use Illuminate\Support\Collection;

/**
 * Who has taught one course and when, across both the SIS mirror and the
 * terms this department has planned.
 *
 * Kept per role rather than per person, because the picker asks a different
 * question for each of its two fields: ANTH 1001 has ten primary instructors
 * and twenty-five assistants, and offering the assistants when a scheduler is
 * naming the instructor of record is worse than offering nobody.
 */
class CourseTeachingHistory {
    /** @return Collection<int, array{emplid: int, role: string, lastTermId: int, isPlanned: bool}> */
    public static function of(int $academicOrg, string $courseCode): Collection {
        return self::taughtTerms($academicOrg, $courseCode)
            ->concat(self::plannedTerms($academicOrg, $courseCode))
            ->groupBy(fn(array $row) => $row['emplid'] . '-' . $row['role'])
            ->map(fn(Collection $rows) => $rows->sortByDesc('lastTermId')->first())
            ->sortByDesc('lastTermId')
            ->values();
    }

    /** @return Collection<int, array{emplid: int, role: string, lastTermId: int, isPlanned: bool}> */
    private static function taughtTerms(int $academicOrg, string $courseCode): Collection {
        return SisClassInstructor::query()
            ->join('sis_class_sections', 'sis_class_sections.id', '=', 'sis_class_instructors.sis_class_section_id')
            ->where('sis_class_sections.academic_org', $academicOrg)
            ->where('sis_class_sections.course_code', $courseCode)
            ->groupBy('sis_class_instructors.emplid', 'sis_class_instructors.role')
            ->selectRaw('sis_class_instructors.emplid, sis_class_instructors.role, MAX(sis_class_sections.term_code) as last_term_code')
            ->get()
            ->map(fn($row) => [
                'emplid' => (int) $row->emplid,
                'role' => $row->role,
                'lastTermId' => (int) $row->last_term_code,
                'isPlanned' => false,
            ]);
    }

    /** @return Collection<int, array{emplid: int, role: string, lastTermId: int, isPlanned: bool}> */
    private static function plannedTerms(int $academicOrg, string $courseCode): Collection {
        return LocalClassInstructor::query()
            ->join('local_class_sections', 'local_class_sections.id', '=', 'local_class_instructors.local_class_section_id')
            ->whereNull('local_class_sections.deleted_at')
            ->where('local_class_sections.academic_org', $academicOrg)
            ->where('local_class_sections.course_code', $courseCode)
            ->groupBy('local_class_instructors.emplid', 'local_class_instructors.role')
            ->selectRaw('local_class_instructors.emplid, local_class_instructors.role, MAX(local_class_sections.term_code) as last_term_code')
            ->get()
            ->map(fn($row) => [
                'emplid' => (int) $row->emplid,
                'role' => $row->role,
                'lastTermId' => (int) $row->last_term_code,
                'isPlanned' => true,
            ]);
    }
}
