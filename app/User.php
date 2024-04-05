<?php

namespace App;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Foundation\Auth\User as Authenticatable;
use OwenIt\Auditing\Contracts\Auditable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Permission\Traits\HasRoles;
use Spatie\Permission\Models\Permission;
use Laravel\Sanctum\HasApiTokens;
use App\Leave;
use Illuminate\Support\Collection;

/**
 * @mixin IdeHelperUser
 */
class User extends Authenticatable implements Auditable {
    use HasFactory;
    use \OwenIt\Auditing\Auditable;
    use Notifiable;
    use SoftDeletes;
    use HasRoles;
    use \Lab404\Impersonate\Models\Impersonate;
    use HasApiTokens;

    public $timestamps = true;

    protected $casts = [
        'send_email_reminders' => 'boolean',
        'notify_of_favorite_changes' => 'boolean',
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'givenname',
        'surname',
        'displayName',
        'email',
        'umndid',
        'ou',
        'send_email_reminders',
        'notify_of_favorite_changes',
        'ssl_eligible',
        'midcareer_eligible',
        'ssl_apply_eligible',
        'emplid',
        'title',
        'office',
        'phone',
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

    public function leaves() {
        return $this->hasMany(Leave::class);
    }

    public function leavesIncludingTrashed() {
        return $this->hasMany(Leave::class)->withTrashed();
    }

    /**
     * Get the groups that this user manages. That is,
     * their `admin` field is set to true.
     *
     * @return Collection<array-key, mixed>
     */
    public function getManagedGroups() {
        return $this->memberships()->where('admin', true)->get()->pluck('group');
    }

    public function managesAnyGroupWithMember(User $member): bool {
        $memberGroupIds = $member->groups->pluck('id');
        $adminGroupIds = $this->getManagedGroups()->pluck('id');

        return $adminGroupIds
            ->intersect($memberGroupIds)
            ->isNotEmpty();
    }

    public function managesGroup(Group $group): bool {
        return $this->getManagedGroups()->pluck('id')->contains($group->id);
    }
}
