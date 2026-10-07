<?php

namespace App\Library\TermPlan;

enum CostSettingType: string {
    case Money = 'money';
    case Percent = 'percent';
    case Count = 'count';
    case Toggle = 'toggle';

    /** @return array<int, string> */
    public function rules(): array {
        return match ($this) {
            self::Money => ['numeric', 'decimal:0,2', 'min:0', 'max:99999999.99'],
            self::Percent => ['numeric', 'decimal:0,2', 'gt:0', 'lte:100'],
            self::Count => ['integer', 'min:0', 'max:40'],
            self::Toggle => ['boolean'],
        };
    }

    public function fromStored(string $stored): float|int|bool {
        return match ($this) {
            self::Money, self::Percent => (float) $stored,
            self::Count => (int) $stored,
            self::Toggle => (float) $stored !== 0.0,
        };
    }
}
