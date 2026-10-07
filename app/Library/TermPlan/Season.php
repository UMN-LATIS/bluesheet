<?php

namespace App\Library\TermPlan;

use InvalidArgumentException;

enum Season: string {
    case Fall = 'fall';
    case Spring = 'spring';
    case Summer = 'summer';

    public static function tryOfTerm(int $termCode): ?self {
        return match ($termCode % 10) {
            3 => self::Spring,
            5 => self::Summer,
            9 => self::Fall,
            default => null,
        };
    }

    /**
     * @throws InvalidArgumentException when `$termCode`
     *   does not end in 3, 5, or 9
     */
    public static function ofTerm(int $termCode): self {
        return self::tryOfTerm($termCode)
            ?? throw new InvalidArgumentException("Term code {$termCode} ends in no known season");
    }
}
