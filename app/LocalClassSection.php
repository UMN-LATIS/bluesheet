<?php

namespace App;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use OwenIt\Auditing\Auditable as AuditableTrait;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

/**
 * One section a scheduler planned for a term the SIS has not published.
 *
 * A term belongs either to the SIS or to the schedulers, so this never
 * shadows a SisClassSection. See TermLock for the rule.
 */
class LocalClassSection extends Model implements AuditableContract {
    use AuditableTrait;
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'term_code',
        'academic_org',
        'course_code',
        'subject',
        'catalog_number',
        'class_section',
        'component',
        'title',
        'credits',
        'enrollment_cap',
        'delivery',
        'notes',
        'is_cancelled',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'term_code' => 'integer',
        'academic_org' => 'integer',
        'credits' => 'integer',
        'enrollment_cap' => 'integer',
        'is_cancelled' => 'boolean',
    ];

    public function meetings(): HasMany {
        return $this->hasMany(LocalClassMeeting::class);
    }

    public function instructors(): HasMany {
        return $this->hasMany(LocalClassInstructor::class);
    }

    public function scopeForDepartmentTerm($query, int $academicOrg, int $termCode) {
        return $query->where('academic_org', $academicOrg)->where('term_code', $termCode);
    }
}
