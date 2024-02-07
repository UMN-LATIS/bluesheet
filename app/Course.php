<?php

namespace App;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Course extends Model {
    use HasFactory;

    protected $fillable = [
        'group_id',
        'subject',
        'catalog_number',
        'title',
        'type',
        'level',
    ];

    // public function courseId(): Attribute {
    //     return Attribute::make(
    //         get: fn ($value) => "{$value->subject}-{$value->catalog_number}",
    //     );
    // }

    // public function unofficialSections() {
    //     return CourseSection::where('course_id', $this->courseId())->get();
    // }

    public function group() {
        return $this->belongsTo(Group::class);
    }
}
