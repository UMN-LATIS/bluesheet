<?php

namespace App;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use OwenIt\Auditing\Auditable as AuditableTrait;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

class JobCodeRate extends Model implements AuditableContract {
    use AuditableTrait;
    use HasFactory;

    protected $fillable = [
        'job_code_id',
        'fiscal_year',
        'cost_per_course',
        'source',
    ];

    protected $casts = [
        'fiscal_year' => 'integer',
        'cost_per_course' => 'decimal:2',
    ];

    public function jobCode(): BelongsTo {
        return $this->belongsTo(JobCode::class);
    }
}
