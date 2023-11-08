<?php

namespace App;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LeaveArtifact extends Model {
    use HasFactory;

    protected $fillable = [
        'label',
        'target',
        'leave_id',
    ];

    public function leave() {
        return $this->belongsTo(Leave::class);
    }
}
