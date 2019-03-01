<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\MembershipWithGroups as MembershipWithGroups;


class User extends JsonResource
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
            'id' => $this->id,
            'givenname' => $this->givenname,
            'surname' => $this->surname,
            'displayName' => $this->displayName,
            'email' => $this->email,
            'site_permissions' => $this->site_permissions,
            'ou' => $this->ou,
            'memberships' => MembershipWithGroups::collection($this->memberships),
        ];
    }
}
