<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class GroupType extends Model
{

	public $timestamps = false;
	
    public function groups() {
    	return $this->belongsTo("App\Group");
    }
}
