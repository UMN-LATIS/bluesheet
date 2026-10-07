<?php

namespace App;

use App\Library\TermPlan\InstructorType;
use App\Library\TermPlan\StudentStatus;
use Illuminate\Database\Eloquent\Model;
use OwenIt\Auditing\Auditable as AuditableTrait;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

class TermCostPersonChoice extends Model implements AuditableContract {
    use AuditableTrait;

    protected $fillable = [
        'academic_org',
        'term_code',
        'emplid',
        'job_code',
        'instructor_type',
        'student_status',
        'override_cost',
        'override_reason',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'academic_org' => 'integer',
        'term_code' => 'integer',
        'emplid' => 'integer',
        'instructor_type' => InstructorType::class,
        'student_status' => StudentStatus::class,
        'override_cost' => 'float',
    ];
}
