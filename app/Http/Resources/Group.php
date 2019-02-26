<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\Membership as MembershipResource;
use Auth;
class Group extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    public function toArray($request)
    {

        return [
            "id"=>$this->id,
            "user_can_edit"=>$this->userCanEdit(Auth::user()),
            "group_title"=>$this->group_title,
            "group_type"=>$this->groupType,
            "private_group"=>$this->private_group,
            "google_group"=>$this->google_group,
            "parent_organization"=>$this->parentOrganization,
            "parent_organization_id"=>$this->parent_organization_id,
            "active"=>$this->active_group,
            "artifacts"=>$this->artifacts,
            "notes"=>$this->notes
        ];
    }
}
