<?php

namespace App;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A person assigned to teach a section, with their role: `PI` for
 * primary instructor, `TA` for teaching assistant.
 */
class SisClassInstructor extends Model {
    use HasFactory;

    protected $fillable = [
        'sis_class_section_id',
        'emplid',
        'role',
    ];

    protected $casts = [
        'emplid' => 'integer',
    ];

    public function section(): BelongsTo {
        return $this->belongsTo(SisClassSection::class, 'sis_class_section_id');
    }

    public function employee(): BelongsTo {
        return $this->belongsTo(SisEmployee::class, 'emplid', 'emplid');
    }

    public function scopePrimaryInstructor($query) {
        return $query->where('role', 'PI');
    }
}
