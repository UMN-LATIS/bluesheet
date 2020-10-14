<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    public $timestamps = true;

    public function members() {
    	return $this->hasMany("App\Membership");
    }

    public function officialRoleCategory() {
        return $this->belongsTo("App\OfficialRoleCategory");
    }

    public function officialGroupType()
    {
        return $this->belongsToMany('App\GroupType');
    }

}
