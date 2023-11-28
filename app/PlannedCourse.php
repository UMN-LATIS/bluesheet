<?php

namespace App;

use App\Library\Bandaid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PlannedCourse extends Model {
    use HasFactory;

    protected $fillable = [
        'subject', // "HIST
        'catalog_number', // "10001W"
        'title', // "History of the World"
        'course_type', // "LEC"
        'course_level', // "UGRD"
        'user_id',
        'term_id',
        'group_id',
    ];

    public function user() {
        return $this->belongsTo(User::class);
    }

    public function term(Bandaid $bandaid) {
        return $bandaid->getTerm($this->term_id);
    }

    public function group() {
        return $this->belongsTo(Group::class);
    }
}
