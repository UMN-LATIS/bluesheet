<?php

namespace App;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A job assignment for an employee within a dept
 */
class SisAppointment extends Model {
    use HasFactory;

    protected $fillable = [
        'emplid',
        'dept_id',
        'dept_name',
        'job_code',
        'position_desc',
        'category',
        'job_indicator',
    ];

    protected $casts = [
        'emplid' => 'integer',
    ];

    public function employee(): BelongsTo {
        return $this->belongsTo(SisEmployee::class, 'emplid', 'emplid');
    }

    public function department(): BelongsTo {
        return $this->belongsTo(SisDepartment::class, 'dept_id', 'dept_id');
    }

    /** Primary appointments, as opposed to secondary ones such as a chair role. */
    public function scopePrimary($query) {
        return $query->where('job_indicator', 'P');
    }
}
