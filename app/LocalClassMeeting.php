<?php

namespace App;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** One meeting pattern of a planned section: a time range and the days it runs. */
class LocalClassMeeting extends Model {
    use HasFactory;

    protected $fillable = [
        'local_class_section_id',
        'starts_at',
        'ends_at',
        'meets_monday',
        'meets_tuesday',
        'meets_wednesday',
        'meets_thursday',
        'meets_friday',
        'meets_saturday',
        'meets_sunday',
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
        return $this->belongsTo(LocalClassSection::class, 'local_class_section_id');
    }
}
