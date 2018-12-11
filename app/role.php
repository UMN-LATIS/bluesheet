<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class role extends Model
{
    public $timestamps = true;

    public function members() {
    	return $this->belongsTo("App\Membership");
    }

}
