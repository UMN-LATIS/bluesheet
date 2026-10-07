<?php

namespace App;

use App\Library\TermPlan\Season;
use App\Library\TermPlan\StudentStatus;
use Illuminate\Database\Eloquent\Model;
use OwenIt\Auditing\Auditable as AuditableTrait;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

class TaAppointmentRate extends Model implements AuditableContract {
    use AuditableTrait;

    protected $fillable = [
        'fiscal_year',
        'season',
        'student_status',
        'appointment_percent',
        'cost_per_term',
        'source',
    ];

    protected $casts = [
        'fiscal_year' => 'integer',
        'season' => Season::class,
        'student_status' => StudentStatus::class,
        'appointment_percent' => 'float',
        'cost_per_term' => 'decimal:2',
    ];
}
