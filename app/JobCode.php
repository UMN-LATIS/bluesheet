<?php

namespace App;

use App\Library\TermPlan\InstructorType;
use App\Library\TermPlan\StudentStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use OwenIt\Auditing\Auditable as AuditableTrait;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

class JobCode extends Model implements AuditableContract {
    use AuditableTrait;
    use HasFactory;

    public const UNSTAFFED_CODE = 'TBA';

    protected $fillable = [
        'code',
        'title',
        'instructor_type',
        'annual_load',
        'student_status',
    ];

    protected $casts = [
        'instructor_type' => InstructorType::class,
        'annual_load' => 'integer',
        'student_status' => StudentStatus::class,
    ];

    public function termRates(): HasMany {
        return $this->hasMany(JobCodeTermRate::class);
    }
}
