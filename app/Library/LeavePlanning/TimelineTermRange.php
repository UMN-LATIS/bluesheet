<?php

namespace App\Library\LeavePlanning;

use App\SisTerm;
use Illuminate\Support\Collection;

class TimelineTermRange {
    private const TERM_CODES_PER_YEAR = 10;

    /**
     * A requested side is kept as given, and an unrequested
     * side moves to meet it. When both are requested, the
     * caller must reject a start after the end.
     *
     * @param Collection<int, SisTerm> $terms must not be empty
     * @param string $today as `Y-m-d`
     * @return array{startTermId: int, endTermId: int}
     */
    public static function of(
        Collection $terms,
        string $today,
        ?int $requestedStart,
        ?int $requestedEnd,
    ): array {
        $terms = $terms->sortBy('term_code')->values();
        $currentTerm = self::termOnOrAfter($terms, $today) ?? $terms->last()->term_code;

        $yearBeforeCurrentTerm = $terms
            ->first(fn(SisTerm $term) => $term->term_code >= $currentTerm - self::TERM_CODES_PER_YEAR)
            ->term_code;

        $yearAfterCurrentTerm = $terms
            ->last(fn(SisTerm $term) => $term->term_code <= $currentTerm + self::TERM_CODES_PER_YEAR)
            ->term_code;

        $start = $requestedStart ?? $yearBeforeCurrentTerm;
        $end = $requestedEnd ?? $yearAfterCurrentTerm;

        if ($requestedStart === null) {
            $start = min($start, $end);
        }

        if ($requestedEnd === null) {
            $end = max($start, $end);
        }

        return ['startTermId' => $start, 'endTermId' => $end];
    }

    private static function termOnOrAfter(Collection $terms, string $date): ?int {
        return $terms->first(fn(SisTerm $term) => $term->ends_on->toDateString() >= $date)?->term_code;
    }
}
