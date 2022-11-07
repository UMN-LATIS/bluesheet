<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use OwenIt\Auditing\Contracts\Auditable;
use Illuminate\Database\Eloquent\SoftDeletes;


class Group extends Model implements Auditable
{
    use \OwenIt\Auditing\Auditable;
    use SoftDeletes;
    public $timestamps = true;

    protected $fillable = [
        'group_title', 'private_group', 'notes', 'google_group', 'show_unit', 'parent_group_id', 'abbreviation', 'dept_id'
    ];

    /**
     * The attributes that should be mutated to dates.
     *
     * @var array
     */
    protected $dates = ['deleted_at', 'start_date', 'end_date'];

    public function parentOrganization() {
    	return $this->belongsTo("App\ParentOrganization");
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
        return $this->members()->where(function($query) {
            return $query->whereNull("end_date")->orWhere("end_date", ">", date('Y-m-d'));
        });
    }

    public function artifacts() {
        return $this->hasMany("App\GroupArtifact");
    }

    public function parentGroup() {
        return $this->belongsTo("App\Group");
    }

    public function childGroups() {
        return $this->hasMany("App\Group", "parent_group_id");
    }
    
    public function activeUsers() {
        return $this->activeMembers->pluck('user');
    }

    public function userCanEdit($user) {
        $activeMembers = $this->activeMembers;
        
        foreach($activeMembers as $member) {
            if($member->user && $member->user->is($user) && $member->admin) {
                return true;
            }
        }
        return false;
    }

    public function getHashAttribute()
    {
        return substr(sha1($this->id . config("app.key")), 0, 10);
    }

}
