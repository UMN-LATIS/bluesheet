<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use OwenIt\Auditing\Auditable as AuditableTrait;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

class TermPersonInput extends Model implements AuditableContract {
    use AuditableTrait;

    protected $fillable = [
        'academic_org',
        'term_code',
        'emplid',
        'notes',
        'year_started',
        'course_releases',
        'release_source',
        'salary',
        'fringe_rate',
        'hourly_rate',
        'hours',
        'health_rate',
        'tuition_per_hour',
        'fee_offset',
        'international_offset',
        'per_credit_payment',
        'credits_taught',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'academic_org' => 'integer',
        'term_code' => 'integer',
        'emplid' => 'integer',
        'year_started' => 'integer',
        'course_releases' => 'integer',
        'salary' => 'float',
        'fringe_rate' => 'float',
        'hourly_rate' => 'float',
        'hours' => 'integer',
        'health_rate' => 'float',
        'tuition_per_hour' => 'float',
        'fee_offset' => 'float',
        'international_offset' => 'float',
        'per_credit_payment' => 'float',
        'credits_taught' => 'integer',
    ];
}
