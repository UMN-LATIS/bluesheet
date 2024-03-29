<?php

namespace App;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @mixin IdeHelperCourseSection
 */
class CourseSection extends Model {
    use HasFactory;

    protected $fillable = [
        'course_id', // "HIST-1001W"
        'term_id', // 1193 (TERM from bandaid)
        'group_id',
        'class_section',
        'is_published',
        'is_cancelled',
    ];

    protected $casts = [
        'is_published' => 'boolean',
        'is_cancelled' => 'boolean',
    ];

    public function group() {
        return $this->belongsTo(Group::class);
    }

    public function enrollments() {
        return $this->hasMany(Enrollment::class);
    }
}
