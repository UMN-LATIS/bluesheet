<?php

namespace App;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Leave extends Model {
    use SoftDeletes;
    use HasFactory;

    public $timestamps = true;
    public $fillable = [
        "user_id",
        "start_date",
        "end_date",
        "status",
        "type",
        "description",
    ];

    // The attributes that should be mutated to dates.
    protected $dates = [
        'start_date',
        'end_date',
        'deleted_at',
    ];

    protected $hidden = [
        'deleted_at',
    ];

    const STATUS_CONFIRMED = 'confirm';
    const STATUS_PENDING = 'pending';
    const STATUS_CANCELLED = 'cancelled';
    const STATUSES = [
        self::STATUS_CONFIRMED,
        self::STATUS_PENDING,
        self::STATUS_CANCELLED,
    ];

    const TYPE_SABBATICAL = 'sabbatical';
    const TYPE_DEVELOPMENT = 'development';
    const TYPE_SINGLE_SEMESTER = 'single_semester';
    const TYPE_COURSE_RELEASE = 'course_release';
    const TYPE_COURSE_BUYOUT = 'course_buyout';
    const TYPE_OTHER = 'other';
    const TYPES = [
        self::TYPE_SABBATICAL,
        self::TYPE_DEVELOPMENT,
        self::TYPE_SINGLE_SEMESTER,
        self::TYPE_COURSE_RELEASE,
        self::TYPE_COURSE_BUYOUT,
        self::TYPE_OTHER,
    ];

    public function user() {
        return $this->belongsTo(User::class);
    }

    public function setStatusAttribute($value) {
        $allowed = [
            self::STATUS_CONFIRMED,
            self::STATUS_PENDING,
            self::STATUS_CANCELLED,
        ];
        if (!in_array($value, $allowed)) {
            throw new \Exception("Invalid leave status");
        }

        $this->attributes['status'] = $value;
    }

    public function setTypeAttribute($value) {
        $allowed = [
            self::TYPE_SABBATICAL,
            self::TYPE_DEVELOPMENT,
            self::TYPE_SINGLE_SEMESTER,
            self::TYPE_COURSE_RELEASE,
            self::TYPE_COURSE_BUYOUT,
            self::TYPE_OTHER,
        ];

        if (!in_array($value, $allowed)) {
            throw new \Exception("Invalid leave type");
        }

        $this->attributes['type'] = $value;
    }
}
