<?php

namespace App;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use OwenIt\Auditing\Auditable as AuditableTrait;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

class GradTermRate extends Model implements AuditableContract {
    use AuditableTrait;
    use HasFactory;

    protected $fillable = [
        'term_code',
        'hourly_rate',
        'health_rate',
        'tuition_per_hour_regular',
        'tuition_per_hour_abd',
        'fee_offset',
        'international_offset',
        'per_credit_payment',
        'source',
    ];

    protected $casts = [
        'term_code' => 'integer',
        'hourly_rate' => 'decimal:2',
        'health_rate' => 'decimal:4',
        'tuition_per_hour_regular' => 'decimal:2',
        'tuition_per_hour_abd' => 'decimal:2',
        'fee_offset' => 'decimal:2',
        'international_offset' => 'decimal:2',
        'per_credit_payment' => 'decimal:2',
    ];

    public function levels(): HasMany {
        return $this->hasMany(GradAppointmentLevel::class)->orderBy('appointment_percent');
    }
}
