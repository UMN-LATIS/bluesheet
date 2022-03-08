<?php

namespace App;

use Illuminate\Notifications\Notifiable;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Foundation\Auth\User as Authenticatable;
use OwenIt\Auditing\Contracts\Auditable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Permission\Traits\HasRoles;
use Spatie\Permission\Models\Permission;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements Auditable
{
    use \OwenIt\Auditing\Auditable;
    use Notifiable;
    use SoftDeletes;
    use HasRoles;
    use \Lab404\Impersonate\Models\Impersonate;
    use HasApiTokens;

    public $timestamps = true;

    /**
     * The attributes that should be mutated to dates.
     *
     * @var array
     */
    protected $dates = ['deleted_at'];

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'givenname', 'surname', 'displayname','email','umndid', 'ou', 'send_email_reminders', 'notify_of_favorite_changes'
    ];

    public function memberships() {
        return $this->hasMany("App\Membership");
    }

    public function groups() {
        return $this->hasManyThrough('App\Group', 'App\Membership', 'user_id', 'id', 'id', 'group_id');
    }

    public function favoriteGroups() {
        return $this->belongsToMany('App\Group', 'favorite_groups');
    }

    public function favoriteRoles() {
        return $this->belongsToMany('App\Role', 'favorite_roles');
    }

     public function getAllPermissionsAttribute() {
        $permissions = [];
        foreach (Permission::all() as $permission) {
            if ($this->can($permission->name)) {
                $permissions[] = $permission->name;
            }
        }
        return $permissions;
    }
}
