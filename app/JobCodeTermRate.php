<?php

namespace App;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use OwenIt\Auditing\Auditable as AuditableTrait;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

class JobCodeTermRate extends Model implements AuditableContract {
    use AuditableTrait;
    use HasFactory;

    protected $fillable = [
        'job_code_id',
        'term_code',
        'salary',
        'fringe_rate',
        'source',
    ];

    protected $casts = [
        'term_code' => 'integer',
        'salary' => 'decimal:2',
        'fringe_rate' => 'decimal:4',
    ];

    public function jobCode(): BelongsTo {
        return $this->belongsTo(JobCode::class);
    }
}
