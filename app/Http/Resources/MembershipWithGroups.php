<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Auth;

/**
 * This is really stupid
 * I just want a way to not return the groups in the membership resource in some cases
 * but the only way to pass a parameter seems to involve doing horrible things
 */

class MembershipWithGroups extends JsonResource
{
    /**
     * Transform the resource collection into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    public function toArray($request)
    {
        $group = $this->group;
        if($group->private_group &&  Auth::user()->id !== $this->user_id && Auth::user()->site_permissions < 200) {
            $group->group_title = "Private Group";
            $group->id = null;
        }

        return [
            "id"=>$this->id,
            "user"=>$this->user,
            "group"=>$this->group,
            "role"=>$this->role,
            "start_date"=>$this->start_date?$this->start_date->format('Y-m-d'):null,
            "end_date"=>$this->end_date?$this->end_date->format('Y-m-d'):null,
            "admin"=>$this->admin,
            "notes"=>$this->notes
        ];
    }
}
