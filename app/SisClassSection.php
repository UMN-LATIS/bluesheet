<?php

namespace App;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * One section of a course in one term.
 *
 * Bandaid returns several rows per section, one for each
 * instructor and each meeting pattern. Those are split into
 * instructors and meetings here, leaving this row holding only
 * the fields that are constant across the whole section.
 */
class SisClassSection extends Model {
    use HasFactory;

    protected $fillable = [
        'term_code',
        'class_number',
        'academic_org',
        'institution',
        'subject',
        'catalog_number',
        'class_section',
        'component',
        'academic_career',
        'title',
        'credits',
        'enrollment_cap',
        'enrollment_total',
        'waitlist_cap',
        'waitlist_total',
        'is_cancelled',
        'crosslist',
    ];

    protected $casts = [
        'term_code' => 'integer',
        'class_number' => 'integer',
        'academic_org' => 'integer',
        'credits' => 'integer',
        'is_cancelled' => 'boolean',
    ];

    public function instructors(): HasMany {
        return $this->hasMany(SisClassInstructor::class);
    }

    public function meetings(): HasMany {
        return $this->hasMany(SisClassMeeting::class);
    }

    public function getCourseCodeAttribute(): string {
        return $this->subject . '-' . $this->catalog_number;
    }

    public function scopeForDepartmentTerm($query, int $academicOrg, int $termCode) {
        return $query->where('academic_org', $academicOrg)->where('term_code', $termCode);
    }

    /** Sections that appear on a weekly calendar: scheduled, and not cancelled. */
    public function scopeScheduled($query) {
        return $query->where('is_cancelled', false)->has('meetings');
    }
}
