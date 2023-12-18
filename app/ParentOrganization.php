<?php

namespace App;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ParentOrganization extends Model {

    use HasFactory;

    public $timestamps = false;

    public function groups() {
        return $this->hasMany("App\Group");
    }

    public function parentOrganization() {
        return $this->belongsTo('App\ParentOrganization');
    }

    public function childOrganizations() {
        return $this->hasMany('App\ParentOrganization');
    }

    public function childOrganizationsRecursive() {
        return $this->hasMany('App\ParentOrganization')->with("childOrganizationsRecursive");
    }
}
