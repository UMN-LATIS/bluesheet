<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use OwenIt\Auditing\Contracts\Auditable;
use Illuminate\Database\Eloquent\SoftDeletes;


class membership extends Model implements Auditable
{
    use \OwenIt\Auditing\Auditable;
    use SoftDeletes;
    public $timestamps = true;

    /**
     * The attributes that should be mutated to dates.
     *
     * @var array
     */
    protected $dates = ['deleted_at', 'start_date', 'end_date'];

    public function role() {
    	return $this->belongsTo("App\Role");
    }

    public function group() {
    	return $this->belongsTo("App\Group");
    }

    public function user() {
    	return $this->belongsTo("App\User");
    }

}
