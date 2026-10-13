<?php

namespace App;

use App\Library\TermPlan\StudentStatus;
use Illuminate\Database\Eloquent\Model;
use OwenIt\Auditing\Auditable as AuditableTrait;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

class TermTaRateOverride extends Model implements AuditableContract {
    use AuditableTrait;

    protected $fillable = [
        'academic_org',
        'term_code',
        'appointment_percent',
        'student_status',
        'cost_per_term',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'academic_org' => 'integer',
        'term_code' => 'integer',
        'appointment_percent' => 'float',
        'student_status' => StudentStatus::class,
        'cost_per_term' => 'float',
    ];
}
