<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use OwenIt\Auditing\Contracts\Auditable;
use Illuminate\Database\Eloquent\SoftDeletes;


class group extends Model implements Auditable
{
    use \OwenIt\Auditing\Auditable;
    use SoftDeletes;
    public $timestamps = true;

    protected $fillable = [
        'group_title', 'private_group', 'notes'
    ];

    /**
     * The attributes that should be mutated to dates.
     *
     * @var array
     */
    protected $dates = ['deleted_at', 'start_date', 'end_date'];

    public function parentGroup() {
    	return $this->belongsTo("App\Group");
    }

    public function groupType() {
    	return $this->belongsTo("App\GroupType");
    }

    public function members() {
    	return $this->hasMany("App\Membership");
    }

    public function users() {
        return $this->hasManyThrough('App\User', 'App\Membership', 'group_id', 'id', 'id', 'user_id');
    }

    public function activeMembers() {
        return $this->members()->whereNull("end_date");
    }

    public function artifacts() {
        return $this->hasMany("App\GroupArtifact");
    }

    
    public function activeUsers() {
        return $this->activeMembers->pluck('user');
    }

    public function userCanEdit($user) {
        $activeMembers = $this->activeMembers;
        if($user->site_permissions >= 200 ) {
            return true;
        }
        foreach($activeMembers as $member) {
            if($member->user == $user && $member->admin) {
                return true;
            }
        }
    }

}
