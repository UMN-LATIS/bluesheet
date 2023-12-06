<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use App\Library\Utilities;

class PersonResource extends JsonResource {
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array|\Illuminate\Contracts\Support\Arrayable|\JsonSerializable
     */
    public function toArray($request) {
        return [
            'id' => $this->id,
            'givenName' => $this->givenname,
            'surName' => $this->surname,
            'displayName' => $this->displayName,
            'email' => $this->email,
            'title' => $this->title,
            // 'leaves' => $this->leaves,
            'leaveIds' => $this->leaveIds,
            'academicAppointment' => Utilities::trimWithFallback($this->jobCategory),
            'emplid' => $this->emplid,
            'sslEligible' => $this->ssl_eligible,
            'midcareerEligible' => $this->midcareer_eligible,
            'sslApplyEligible' => $this->ssl_apply_eligible
        ];
    }
}