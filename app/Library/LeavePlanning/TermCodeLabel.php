<?php

namespace App\Library\LeavePlanning;

use InvalidArgumentException;

class TermCodeLabel {
    private const SEASON_BY_LAST_DIGIT = [3 => 'SP', 5 => 'SU', 9 => 'FA'];

    /**
     * 1269 → "FA26".
     *
     * @throws InvalidArgumentException
     *   when the last digit is not 3, 5, or 9
     */
    public static function of(int $termCode): string {
        $season = self::SEASON_BY_LAST_DIGIT[$termCode % 10]
            ?? throw new InvalidArgumentException("Term code {$termCode} ends in no known season");

        return $season . str_pad((string) (intdiv($termCode, 10) % 100), 2, '0', STR_PAD_LEFT);
    }
}
