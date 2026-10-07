<?php

namespace App;

use App\Library\TermPlan\InstructorType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use OwenIt\Auditing\Auditable as AuditableTrait;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

class JobCode extends Model implements AuditableContract {
    use AuditableTrait;

    protected $fillable = [
        'code',
        'title',
        'instructor_type',
    ];

    protected $casts = [
        'instructor_type' => InstructorType::class,
    ];

    public function rates(): HasMany {
        return $this->hasMany(JobCodeRate::class);
    }
}
