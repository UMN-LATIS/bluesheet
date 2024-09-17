<?php

namespace App;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Contracts\CourseInterface;

/**
 * @mixin IdeHelperCourse
 */
class Course extends Model implements CourseInterface {
    use HasFactory;

    protected $fillable = [
        'group_id',
        'subject',
        'catalog_number',
        'title',
        'type',
        'level',
    ];

    public function group() {
        return $this->belongsTo(Group::class);
    }

    public function getSubject(): string {
        return $this->subject;
    }

    public function getCatalogNumber(): string {
        return $this->catalog_number;
    }

    public function getTitle(): string {
        return $this->title;
    }

    public function getCourseCode(): string {
        return $this->getSubject() . '-' . $this->getCatalogNumber();
    }

    public function getCourseType(): string {
        return $this->type;
    }

    public function getCourseLevel(): string {
        return $this->level;
    }

    public function getSource(): string {
        return 'local';
    }

    public function getApiId(): string {
        return $this->getCourseCode();
    }

}
