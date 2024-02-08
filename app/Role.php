<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

/**
 * @mixin IdeHelperRole
 */
class Role extends Model
{
    public $timestamps = true;
    public $fillable = ["label", "official_role_category_id"];
    public function members() {
    	return $this->hasMany("App\Membership");
    }

    public function officialRoleCategory() {
        return $this->belongsTo("App\OfficialRoleCategory");
    }

    public function officialGroupType()
    {
        return $this->belongsToMany('App\GroupType');
    }

}
