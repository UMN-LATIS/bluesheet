<?php

namespace App;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use OwenIt\Auditing\Contracts\Auditable;
use Illuminate\Support\Carbon;

/**
 * @mixin IdeHelperLeave
 */
class Leave extends Model implements Auditable {
    use SoftDeletes;
    use HasFactory;
    use \OwenIt\Auditing\Auditable;

    public $timestamps = true;
    public $fillable = [
        "user_id",
        "start_date",
        "end_date",
        "status",
        "type",
        "description",
    ];

    public $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
    ];

    protected $hidden = [
        'deleted_at',
        'synchronized_leave',
    ];

    const STATUS_CONFIRMED = 'confirmed';
    const STATUS_PENDING = 'pending';
    const STATUS_ELIGIBLE = 'eligible';
    const STATUS_CANCELLED = 'cancelled';
    const STATUSES = [
        self::STATUS_CONFIRMED,
        self::STATUS_PENDING,
        self::STATUS_CANCELLED,
        self::STATUS_ELIGIBLE
    ];

    const TYPE_SABBATICAL = 'sabbatical';
    const TYPE_DEVELOPMENT = 'development';
    const TYPE_SINGLE_SEMESTER = 'single_semester';
    const TYPE_COURSE_RELEASE = 'course_release';
    const TYPE_COURSE_BUYOUT = 'course_buyout';
    const TYPE_PHASED_RETIREMENT = 'phased_retirement';
    const TYPE_OTHER = 'other';
    const TYPES = [
        self::TYPE_SABBATICAL,
        self::TYPE_DEVELOPMENT,
        self::TYPE_SINGLE_SEMESTER,
        self::TYPE_COURSE_RELEASE,
        self::TYPE_COURSE_BUYOUT,
        self::TYPE_OTHER,
        self::TYPE_PHASED_RETIREMENT,
    ];

    public function user() {
        return $this->belongsTo(User::class);
    }

    public function artifacts() {
        return $this->hasMany(LeaveArtifact::class);
    }

    public function setStatusAttribute($value) {
        $allowed = [
            self::STATUS_CONFIRMED,
            self::STATUS_PENDING,
            self::STATUS_CANCELLED,
            self::STATUS_ELIGIBLE,
        ];
        if (!in_array($value, $allowed)) {
            throw new \Exception("Invalid leave status");
        }

        $this->attributes['status'] = $value;
    }

    public function setTypeAttribute($value) {
        $allowed = Leave::TYPES;

        if (!in_array($value, $allowed)) {
            throw new \Exception("Invalid leave type");
        }

        $this->attributes['type'] = $value;
    }

    // return only the date, no time to avoid timezone parsing issues
    public function getStartDateAttribute($value) {
        return \Carbon\Carbon::parse($value)->format('Y-m-d');
    }

    public function getEndDateAttribute($value) {
        return \Carbon\Carbon::parse($value)->format('Y-m-d');
    }

    /**
     *  Does this leave fall within the given term?
     *
     * @param Object<{
     *   id: int,
     *   TERM: int,
     *   TERM_BEGIN_DT: string, // "2019-01-22"
     *   TERM_END_DT: string,  // "2019-05-15"
     *   TERM_DESCRIPTION: string, //"Spring 2019"
     *   INSTITUTION: string, // "UMNTC"
     *   ACADEMIC_CAREER: string, // "UGRD"
     * }> $term
     * @return bool
     */
    public function doesLeaveFallInTerm($term) {
        $termStart = Carbon::parse($term->TERM_BEGIN_DT);
        $leaveStart = Carbon::parse($this->start_date);
        $leaveEnd = Carbon::parse($this->end_date);

        return $termStart->isBetween($leaveStart, $leaveEnd);
    }
}
