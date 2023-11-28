<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;
use OwenIt\Auditing\Auditable as AuditableTrait;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\PlannedCourse;

class Group extends Model implements AuditableContract {
    use AuditableTrait;
    use SoftDeletes;
    use HasFactory;

    public $timestamps = true;

    protected $casts = [
        'include_child_groups' => 'boolean',
        'show_unit' => 'boolean'
    ];

    protected $fillable = [
        'group_title',
        'private_group',
        'notes',
        'google_group',
        'show_unit', // show member's unit in group member list
        'parent_group_id',
        'abbreviation',
        'dept_id',
        'include_child_groups'
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
        return $this->members()->where(function ($query) {
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

    public function plannedCourses(): HasMany {
        return $this->hasMany(PlannedCourse::class);
    }

    public function activeUsers() {
        return $this->activeMembers->pluck('user');
    }

    public function userCanEdit($user) {
        $activeMembers = $this->activeMembers;

        foreach ($activeMembers as $member) {
            if ($member->user && $member->user->is($user) && $member->admin) {
                return true;
            }
        }
        return false;
    }

    public function getHashAttribute() {
        return substr(sha1($this->id . config("app.key")), 0, 10);
    }
}
