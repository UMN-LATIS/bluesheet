<?php

namespace App\Library\LeavePlanning;

use App\Leave;
use App\SisTerm;
use Illuminate\Support\Collection;

class TimelineTermRange {
    /**
     * A requested side is kept as given, and an unrequested
     * side moves to meet it. When both are requested, the
     * caller must reject a start after the end.
     *
     * @param Collection<int, SisTerm> $terms must not be empty
     * @param Collection<int, Leave> $leaves
     *   must exclude cancelled leaves
     * @param string $today as `Y-m-d`
     * @return array{startTermId: int, endTermId: int}
     */
    public static function of(
        Collection $terms,
        Collection $leaves,
        string $today,
        ?int $requestedStart,
        ?int $requestedEnd,
    ): array {
        $terms = $terms->sortBy('term_code')->values();
        $currentTerm = self::termOnOrAfter($terms, $today) ?? $terms->last()->term_code;

        $earliestInProgressStart = $leaves
            ->filter(fn(Leave $leave) => $leave->start_date <= $today && $leave->end_date >= $today)
            ->min('start_date');

        $inProgressLeaveStartTerm = $earliestInProgressStart === null
            ? $currentTerm
            : self::termOnOrAfter($terms, $earliestInProgressStart) ?? $currentTerm;

        $latestLeaveEnd = $leaves->max('end_date');

        $latestLeaveEndTerm = $latestLeaveEnd === null
            ? $currentTerm
            : self::termOnOrBefore($terms, $latestLeaveEnd) ?? $currentTerm;

        $start = $requestedStart ?? min($currentTerm, $inProgressLeaveStartTerm);
        $end = $requestedEnd ?? max($currentTerm, $latestLeaveEndTerm);

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

    private static function termOnOrBefore(Collection $terms, string $date): ?int {
        return $terms->last(fn(SisTerm $term) => $term->begins_on->toDateString() <= $date)?->term_code;
    }
}
