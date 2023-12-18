<?php

namespace App;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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

    public function group() {
        return $this->belongsTo(Group::class);
    }

    public function enrollments() {
        return $this->hasMany(Enrollment::class);
    }
}
