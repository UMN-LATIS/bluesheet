<?php

namespace App;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Someone assigned to teach a planned section.
 *
 * `emplid` names a person in the SIS mirror without a foreign key into it,
 * because that mirror is dropped and recreated nightly. A hire with no emplid
 * yet is recorded in the section's notes, and the section stays unassigned.
 */
class LocalClassInstructor extends Model {
    use HasFactory;

    protected $fillable = ['local_class_section_id', 'emplid', 'role'];

    protected $casts = ['emplid' => 'integer'];

    public function section(): BelongsTo {
        return $this->belongsTo(LocalClassSection::class, 'local_class_section_id');
    }

    /** Null until the nightly import has seen this person. */
    public function employee(): BelongsTo {
        return $this->belongsTo(SisEmployee::class, 'emplid', 'emplid');
    }
}
