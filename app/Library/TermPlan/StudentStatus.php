<?php

namespace App\Library\TermPlan;

enum StudentStatus: string {
    case Regular = 'regular';
    case Abd = 'abd';

    public function label(): string {
        return match ($this) {
            self::Regular => 'Regular',
            self::Abd => 'ABD',
        };
    }
}
