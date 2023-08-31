<?php

namespace App\Http\Resources;
use Hash;
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
            "user_can_edit"=>Auth::user()?$this->userCanEdit(Auth::user()):false,
            "group_title"=>$this->group_title,
            "abbreviation"=>$this->abbreviation,
            "dept_id"=>$this->dept_id,
            "group_type"=>$this->groupType,
            "private_group"=>$this->private_group,
            "parent_group_id"=>$this->parent_group_id,
            "parent_group"=>$this->parentGroup,
            "child_groups"=>$this->childGroups,
            "google_group"=>$this->google_group,
            "show_unit"=> $this->show_unit,
            "secret_hash"=> $this->hash,
            "parent_organization"=>$this->parentOrganization,
            "parent_organization_id"=>$this->parent_organization_id,
            "active"=>$this->active_group,
            "artifacts"=>$this->artifacts,
            "notes"=>$this->notes,
            "include_child_groups"=>$this->include_child_groups,
            "members"=>$this->relationLoaded('members')?($this->members->map(function($membership) {
                return new MembershipResource($membership);})):[]
        ];
    }
}
