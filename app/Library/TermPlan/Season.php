<?php

namespace App\Library\TermPlan;

enum Season: string {
    case Fall = 'fall';
    case Spring = 'spring';
    case Summer = 'summer';

    public static function tryFromTermCode(int $termCode): ?self {
        return match ($termCode % 10) {
            3 => self::Spring,
            5 => self::Summer,
            9 => self::Fall,
            default => null,
        };
    }
}
