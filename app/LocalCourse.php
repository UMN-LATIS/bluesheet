<?php

namespace App;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use OwenIt\Auditing\Auditable as AuditableTrait;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

/**
 * A course a scheduler named that the SIS has not published, such as one
 * awaiting a catalog number. Shares a key space with SisCourse: where both
 * hold the same course code, the SIS row is the one that is shown.
 */
class LocalCourse extends Model implements AuditableContract {
    use AuditableTrait;
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'course_code',
        'subject',
        'catalog_number',
        'title',
        'credits',
        'academic_org',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'credits' => 'integer',
        'academic_org' => 'integer',
    ];
}
