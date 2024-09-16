<?php

namespace App;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Contracts\EnrollmentInterface;

/**
 * @mixin IdeHelperEnrollment
 */
class Enrollment extends Model implements EnrollmentInterface {
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

    public function getApiId(): string {
        return join('_', [
            $this->user->emplid,
            $this->courseSection->getApiId(),
        ]);
    }

    public function getDBId(): ?int
    {
        return $this->id;
    }

    public function getEmplid(): string
    {
        return $this->user->emplid;
    }

    public function getSectionApiId(): string
    {
        return $this->courseSection->getApiId();
    }

    public function getRole(): string
    {
        return $this->role;
    }

    public function getSource(): string
    {
        return 'local';
    }
}
