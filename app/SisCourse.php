<?php

namespace App;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * One course a department has offered, independent of any term.
 *
 * Bandaid has no course endpoint, so these rows are derived from the class
 * list by CourseRecordDeriver and rebuilt with the rest of the mirror each
 * night. Title and credits come from the course's most recent offering.
 */
class SisCourse extends Model {
    use HasFactory;

    protected $fillable = [
        'course_code',
        'subject',
        'catalog_number',
        'title',
        'credits',
        'last_offered_term_code',
        'academic_org',
    ];

    protected $casts = [
        'credits' => 'integer',
        'last_offered_term_code' => 'integer',
        'academic_org' => 'integer',
    ];
}
