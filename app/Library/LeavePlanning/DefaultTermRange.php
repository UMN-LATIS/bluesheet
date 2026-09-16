<?php

namespace App\Library\LeavePlanning;

use App\Leave;
use App\SisTerm;
use Illuminate\Support\Collection;

class DefaultTermRange {
    /**
     * A requested side is kept as given. The other side
     * moves so the start never comes after the end.
     *
     * @param Collection<int, SisTerm> $terms
     * @param Collection<int, Leave> $leaves
     *   cancelled leaves already left out
     * @param string $today as `Y-m-d`
     * @return array{startTermId: int, endTermId: int}|null
     *   null when there are no terms
     */
    public static function resolve(
        Collection $terms,
        Collection $leaves,
        string $today,
        ?int $requestedStart = null,
        ?int $requestedEnd = null,
    ): ?array {
        if ($terms->isEmpty()) {
            return null;
        }

        $terms = $terms->sortBy('term_code')->values();
        $currentTerm = self::termOnOrAfter($terms, $today) ?? $terms->last()->term_code;

        $earliestInProgressStart = $leaves
            ->filter(fn(Leave $leave) => $leave->start_date <= $today && $leave->end_date >= $today)
            ->min('start_date');

        $latestUpcomingEnd = $leaves
            ->filter(fn(Leave $leave) => $leave->end_date >= $today)
            ->max('end_date');

        $start = $requestedStart ?? min(
            $currentTerm,
            $earliestInProgressStart === null
                ? $currentTerm
                : self::termOnOrAfter($terms, $earliestInProgressStart),
        );

        $end = $requestedEnd ?? max(
            $currentTerm,
            $latestUpcomingEnd === null
                ? $currentTerm
                : self::termOnOrBefore($terms, $latestUpcomingEnd) ?? $currentTerm,
        );

        return [
            'startTermId' => $requestedStart === null ? min($start, $end) : $start,
            'endTermId' => $requestedEnd === null ? max($start, $end) : $end,
        ];
    }

    private static function termOnOrAfter(Collection $terms, string $date): ?int {
        return $terms->first(fn(SisTerm $term) => $term->ends_on->toDateString() >= $date)?->term_code;
    }

    private static function termOnOrBefore(Collection $terms, string $date): ?int {
        return $terms->last(fn(SisTerm $term) => $term->begins_on->toDateString() <= $date)?->term_code;
    }
}
