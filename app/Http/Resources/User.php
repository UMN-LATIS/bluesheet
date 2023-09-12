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
            'office' => $this->office,
            'title' => $this->title,
            'ou' => $this->ou,
            'memberships' => MembershipWithGroups::collection($this->memberships),
            'favoriteGroups' => $this->favoriteGroups,
            'favoriteRoles' => $this->favoriteRoles,
            'send_email_reminders' => $this->send_email_reminders,
            'notify_of_favorite_changes' => $this->notify_of_favorite_changes,
            'ssl_eligible' => $this->ssl_eligible,
            'midcareer_eligible' => $this->midcareer_eligible,
            'ssl_apply_eligible' => $this->ssl_apply_eligible,
            'leaves'=>$this->when(($request->user()->hasPermissionTo('view leaves') || $request->user()->id == $this->id), $this->leaves)
        ];
    }
}
