<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use OwenIt\Auditing\Contracts\Auditable;
use Illuminate\Database\Eloquent\SoftDeletes;


class Membership extends Model implements Auditable
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

    protected $fillable = ['group_id', 'user_id', 'role_id', 'start_date', 'end_date', 'notes', 'admin'];
    
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
