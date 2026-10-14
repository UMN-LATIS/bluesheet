<?php

namespace App\Library\TermPlan;

use Illuminate\Database\Eloquent\Model;

final class GradRateInputs {
    public const COLUMN_BY_KEY = [
        'hourlyRate' => 'hourly_rate',
        'healthRate' => 'health_rate',
        'tuitionPerHourRegular' => 'tuition_per_hour_regular',
        'tuitionPerHourAbd' => 'tuition_per_hour_abd',
        'feeOffset' => 'fee_offset',
        'internationalOffset' => 'international_offset',
        'perCreditPayment' => 'per_credit_payment',
    ];

    /** @return array<string, float|null> */
    public static function fromRow(Model $row): array {
        $inputs = [];
        foreach (self::COLUMN_BY_KEY as $key => $column) {
            $inputs[$key] = $row->{$column} === null ? null : (float) $row->{$column};
        }

        return $inputs;
    }
}
