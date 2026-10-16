<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use OwenIt\Auditing\Auditable as AuditableTrait;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

class TermSectionPayOverride extends Model implements AuditableContract {
    use AuditableTrait;

    protected $fillable = [
        'academic_org',
        'term_code',
        'course_code',
        'class_section',
        'emplid',
        'salary',
        'fringe_rate',
        'appointment_percent',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'academic_org' => 'integer',
        'term_code' => 'integer',
        'emplid' => 'integer',
        'salary' => 'float',
        'fringe_rate' => 'float',
        'appointment_percent' => 'float',
    ];
}
