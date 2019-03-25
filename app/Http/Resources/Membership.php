<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Auth;

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
        return [
            "filtered"=>false,
            "id"=>$this->id,
            "user"=>$this->user,
            "role"=>$this->role,
            "start_date"=>$this->start_date?$this->start_date->format('Y-m-d'):null,
            "end_date"=>$this->end_date?$this->end_date->format('Y-m-d'):null,
            "admin"=>$this->admin,
            "notes"=>$this->notes
        ];
    }
}
