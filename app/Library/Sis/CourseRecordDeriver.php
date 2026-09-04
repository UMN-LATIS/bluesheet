<?php

namespace App\Library\Sis;

use Illuminate\Support\Collection;

/**
 * Derives one course row per course code from Bandaid's class list.
 *
 * Bandaid has no course endpoint, so course-level facts arrive on every
 * section of every offering. A course is (subject, catalog_number): it is not
 * scoped to a term, and component is not part of its identity, because within
 * a term every component of a course reports the same title and credits.
 *
 * Those facts do drift from one term to the next, mostly retitling. The most
 * recent offering wins and every value it overrode is reported, so a rename
 * never passes unnoticed. This class performs no I/O, which is what makes it
 * worth testing directly.
 */
class CourseRecordDeriver {
    /** Course-level facts whose drift across terms is worth reporting. */
    private const REPORTED_FIELDS = ['title', 'credits'];

    /**
     * @param iterable<object|array> $classRecords raw records from Bandaid
     * @return array{courses: Collection<int, array>, conflicts: Collection<int, array>}
     */
    public function derive(iterable $classRecords): array {
        $offeringsByCourse = collect($classRecords)
            ->map(fn($record) => (array) $record)
            // a course nobody is offering is not in the catalog we present,
            // which is the rule the course endpoint already applied
            ->reject(fn(array $record) => (bool) ($record['CANCELLED'] ?? 0))
            ->map(fn(array $record) => $this->toOffering($record))
            ->groupBy('course_code')
            ->map(fn(Collection $offerings) => $offerings->sortByDesc('term_code')->values());

        return [
            'courses' => $offeringsByCourse->map(fn(Collection $o) => $this->toCourse($o))->values(),
            'conflicts' => $offeringsByCourse->flatMap(fn(Collection $o) => $this->conflictsIn($o))->values(),
        ];
    }

    private function toOffering(array $record): array {
        return [
            'course_code' => $record['SUBJECT'] . '-' . $record['CATALOG_NUMBER'],
            'subject' => $record['SUBJECT'],
            'catalog_number' => $record['CATALOG_NUMBER'],
            'academic_org' => $record['ACADEMIC_ORG'],
            'title' => $record['DESCRIPTION'],
            'credits' => $record['ACADEMIC_PROGRESS_CREDITS'] ?? null,
            'term_code' => $record['TERM'],
        ];
    }

    /** @param Collection<int, array> $offerings one course's, most recent first */
    private function toCourse(Collection $offerings): array {
        $latest = $offerings->first();

        return [
            'course_code' => $latest['course_code'],
            'subject' => $latest['subject'],
            'catalog_number' => $latest['catalog_number'],
            'academic_org' => $latest['academic_org'],
            'title' => $this->winner($offerings, 'title')['title'],
            'credits' => $this->winner($offerings, 'credits')['credits'] ?? null,
            'last_offered_term_code' => $latest['term_code'],
        ];
    }

    /**
     * The most recent offering that reports the field at all.
     *
     * Around one section in thirty reports no credit value. Skipping those
     * keeps a course's credits rather than blanking them whenever the newest
     * offering happens to be one of them. Falls back to the most recent
     * offering when every one of them is silent, so the caller always has a
     * row to read identity off.
     *
     * @param Collection<int, array> $offerings one course's, most recent first
     * @return array the winning offering
     */
    private function winner(Collection $offerings, string $field): array {
        return $offerings->first(fn(array $offering) => $offering[$field] !== null)
            ?? $offerings->first();
    }

    /**
     * One row per value the winner displaced, naming the most recent term that
     * carried it. Offerings that report nothing are silent rather than
     * disagreeing, so they are skipped on both sides of the comparison.
     *
     * @param Collection<int, array> $offerings one course's, most recent first
     * @return Collection<int, array>
     */
    private function conflictsIn(Collection $offerings): Collection {
        return collect(self::REPORTED_FIELDS)->flatMap(function (string $field) use ($offerings) {
            $winner = $this->winner($offerings, $field);

            return $offerings
                ->filter(fn(array $o) => $o[$field] !== null && $o[$field] !== $winner[$field])
                ->unique($field)
                ->map(fn(array $o) => [
                    'course_code' => $o['course_code'],
                    'field' => $field,
                    'kept' => $winner[$field],
                    'kept_term_code' => $winner['term_code'],
                    'overridden' => $o[$field],
                    'overridden_term_code' => $o['term_code'],
                ])
                ->values();
        });
    }
}
