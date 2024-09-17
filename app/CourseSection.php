<?php

namespace App;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Contracts\CourseSectionInterface;

/**
 * @mixin IdeHelperCourseSection
 */
class CourseSection extends Model implements CourseSectionInterface {
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

    public function getApiId(): string {
        // note: we're using a id field that remains fixed for the record
        // even after updates to avoid issues when a user changes the term
        // or course or instructor
        return join('-',[
            'local-db',
            $this->id,
        ]);
    }

    public function getCourseApiId(): string
    {
        return $this->course_id; // "HIST-1001W"
    }

    public function getDBId(): int | null {
        return $this->id;
    }

    public function getTermId(): int {
        return $this->term_id;
    }

    public function getClassSection(): string {
        return $this->class_section;
    }

    public function getCourse(): Course {
        return $this->course;
    }

    public function getEnrollmentCap(): int {
        return 0;
    }

    public function getEnrollmentTotal(): int {
        return 0;
    }

    public function getWaitlistCap(): int {
        return 0;
    }

    public function getWaitlistTotal(): int {
        return 0;
    }

    public function isCancelled(): bool {
        return $this->is_cancelled;
    }

    public function isPublished(): bool {
        return $this->is_published;
    }

    public function getSource(): string {
        return 'local';
    }

}
