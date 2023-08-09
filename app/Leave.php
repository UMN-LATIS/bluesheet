<?php

namespace App;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Leave extends Model {
    use HasFactory;
    const STATUS_CONFIRMED = 'confirm';
    const STATUS_PENDING = 'pending';
    const STATUS_CANCELLED = 'cancelled';
    const TYPE_SABBATICAL = 'sabbatical';
    const TYPE_DEVELOPMENT = 'development';
    const TYPE_SINGLE_SEMESTER = 'single_semester';
    const TYPE_COURSE_RELEASE = 'course_release';
    const TYPE_COURSE_BUYOUT = 'course_buyout';
    const TYPE_OTHER = 'other';

    public function getRouteKeyName() {
        // laravel will interpret singular of "leaves" as "leaf"
        // this will force it to use "leave" instead
        return 'leave';
    }
}
