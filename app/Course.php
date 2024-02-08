<?php

namespace App;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @mixin IdeHelperCourse
 */
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

    public function courseCode(): Attribute {
        return Attribute::make(
            get: fn (mixed $value, array $attributes) => join('-', [
                $attributes['subject'],
                $attributes['catalog_number'],
            ]),
        );
    }

    public function group() {
        return $this->belongsTo(Group::class);
    }
}
