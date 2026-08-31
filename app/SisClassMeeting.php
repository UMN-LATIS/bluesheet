<?php

namespace App;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * When a section meets: one time range and the days it recurs on.
 *
 * A section with no rows here has no scheduled meeting, either
 * because it never meets (asynchronous), as with independent study,
 * or because the SIS has not scheduled it yet.
 *
 * Same-time rows are merged by ClassRecordTransformer before insert.
 */
class SisClassMeeting extends Model {
    use HasFactory;

    public const DAY_COLUMNS = [
        'meets_monday',
        'meets_tuesday',
        'meets_wednesday',
        'meets_thursday',
        'meets_friday',
        'meets_saturday',
        'meets_sunday',
    ];

    protected $fillable = [
        'sis_class_section_id',
        'starts_at',
        'ends_at',
        ...self::DAY_COLUMNS,
    ];

    protected $casts = [
        'meets_monday' => 'boolean',
        'meets_tuesday' => 'boolean',
        'meets_wednesday' => 'boolean',
        'meets_thursday' => 'boolean',
        'meets_friday' => 'boolean',
        'meets_saturday' => 'boolean',
        'meets_sunday' => 'boolean',
    ];

    public function section(): BelongsTo {
        return $this->belongsTo(SisClassSection::class, 'sis_class_section_id');
    }

    public function scopeMeetsOn($query, string $dayColumn) {
        return $query->where($dayColumn, true);
    }
}
