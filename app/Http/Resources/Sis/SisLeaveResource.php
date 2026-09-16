<?php

namespace App\Http\Resources\Sis;

use Illuminate\Http\Resources\Json\JsonResource;

class SisLeaveResource extends JsonResource {
    public function toArray($request) {
        return [
            'id' => $this->id,
            'userId' => $this->user_id,
            'emplid' => $this->user?->emplid,
            'name' => $this->user?->displayName,
            'lastName' => $this->user?->surname,
            'type' => $this->type,
            'status' => $this->status,
            'startDate' => $this->start_date,
            'endDate' => $this->end_date,
        ];
    }
}
