<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class GroupType extends Model
{

	public $timestamps = false;
	public $fillable = ["label"];
    public function groups() {
    	return $this->belongsTo("App\Group");
    }

    public function officialRoles()
    {
        return $this->belongsToMany('App\Role');
    }
}
