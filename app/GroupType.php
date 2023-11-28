<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class GroupType extends Model {

    use HasFactory;

    public $timestamps = false;
    public $fillable = ["label"];

    public function groups() {
        return $this->belongsTo("App\Group");
    }

    public function officialRoles() {
        return $this->belongsToMany('App\Role');
    }
}
