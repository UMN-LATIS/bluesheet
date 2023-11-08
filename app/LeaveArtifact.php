<?php

namespace App;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LeaveArtifact extends Model
{
    use HasFactory;

    public function leave() {
        return $this->belongsTo(Leave::class);
    }
}
