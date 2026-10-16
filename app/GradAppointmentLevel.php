<?php

namespace App;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use OwenIt\Auditing\Auditable as AuditableTrait;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

class GradAppointmentLevel extends Model implements AuditableContract {
    use AuditableTrait;
    use HasFactory;

    protected $fillable = [
        'grad_term_rate_id',
        'appointment_percent',
        'hours',
    ];

    protected $casts = [
        'appointment_percent' => 'float',
        'hours' => 'integer',
    ];

    public function gradTermRate(): BelongsTo {
        return $this->belongsTo(GradTermRate::class);
    }
}
