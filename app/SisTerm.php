<?php

namespace App;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * An academic term on the Twin Cities campus.
 *
 * Other campuses are not imported. One term code still yields
 * several rows, one per academic career, because their dates
 * differ: fall 2026 undergraduate runs to 2026-12-23 while
 * medicine ends 2026-12-18. Undergraduate and graduate always
 * share dates.
 */
class SisTerm extends Model {
    use HasFactory;

    protected $fillable = [
        'term_code',
        'institution',
        'academic_career',
        'description',
        'begins_on',
        'ends_on',
    ];

    protected $casts = [
        'term_code' => 'integer',
        'begins_on' => 'date',
        'ends_on' => 'date',
    ];

    /** Undergraduate dates, which graduate terms share. */
    public function scopeUndergrad($query) {
        return $query->where('academic_career', 'UGRD');
    }
}
