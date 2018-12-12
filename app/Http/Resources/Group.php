<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\Membership as MembershipResource;

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
            "group_title"=>$this->group_title,
            "group_type_id"=>$this->group_type_id,
            "group_type"=>$this->groupType->group_type,
            "parent_group"=>$this->parentGroup,
            "parent_group_id"=>$this->parent_group_id,
            "members"=>MembershipResource::collection($this->members),
        ];
    }
}
