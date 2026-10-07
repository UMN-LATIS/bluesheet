<?php

namespace App\Library\TermPlan;

use InvalidArgumentException;

final class FiscalYear {
    /**
     * Returns the fiscal year, named by the June it ends in:
     * FY2027 runs July 2026 to June 2027, so Fall 2026 (1269)
     * and Spring 2027 (1273) both return 2027.
     *
     * @throws InvalidArgumentException when `$termCode` does
     *   not end in 3, 5, or 9
     */
    public static function ofTerm(int $termCode): int {
        $twoDigitYear = intdiv($termCode, 10) % 100;
        $calendarYear = 2000 + $twoDigitYear;

        return Season::ofTerm($termCode) === Season::Fall
            ? $calendarYear + 1
            : $calendarYear;
    }
}
