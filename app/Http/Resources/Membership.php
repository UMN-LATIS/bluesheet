<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class Membership extends JsonResource
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
            "group"=>$group,
            "role"=>$this->role,
            "start_date"=>$this->start_date?$this->start_date->format('Y-m-d H:i:s'):null,
            "end_date"=>$this->end_date?$this->end_date->format('Y-m-d H:i:s'):null,
            "admin"=>$this->admin,
            "notes"=>$this->notes
        ];
    }
}
