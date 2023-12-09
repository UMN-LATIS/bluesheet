<?php

namespace App;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Enrollment extends Model {
    use HasFactory;

    protected $fillable = [
        'course_section_id',
        'user_id',
        'role', // "PI", "TA"
    ];

    public function courseSection() {
        return $this->belongsTo(CourseSection::class);
    }

    public function user() {
        return $this->belongsTo(User::class);
    }
}
