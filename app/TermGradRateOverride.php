<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use OwenIt\Auditing\Auditable as AuditableTrait;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

class TermGradRateOverride extends Model implements AuditableContract {
    use AuditableTrait;

    protected $fillable = [
        'academic_org',
        'term_code',
        'hourly_rate',
        'health_rate',
        'tuition_per_hour_regular',
        'tuition_per_hour_abd',
        'fee_offset',
        'international_offset',
        'per_credit_payment',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'academic_org' => 'integer',
        'term_code' => 'integer',
        'hourly_rate' => 'float',
        'health_rate' => 'float',
        'tuition_per_hour_regular' => 'float',
        'tuition_per_hour_abd' => 'float',
        'fee_offset' => 'float',
        'international_offset' => 'float',
        'per_credit_payment' => 'float',
    ];
}
