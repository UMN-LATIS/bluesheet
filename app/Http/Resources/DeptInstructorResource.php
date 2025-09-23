<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use App\Library\Utilities;

class DeptInstructorResource extends JsonResource {
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array|\Illuminate\Contracts\Support\Arrayable|\JsonSerializable
     */
    public function toArray($request) {
        return [
            'id' => $this->id,
            'givenName' => $this->givenname ?? '',
            'surName' => $this->surname ?? '',
            'displayName' => $this->displayName,
            'email' => $this->email,
            'title' => $this->title,
            'leaveIds' => $this->leaveIds,
            'academicAppointments' => $this->jobCategories,
            'hasActiveDeptAppointment' => $this->hasActiveDeptAppointment,
            'jobCodes' => $this->jobCodes,
            'emplid' => $this->emplid,
            'sslEligible' => $this->ssl_eligible,
            'midcareerEligible' => $this->midcareer_eligible,
            'sslApplyEligible' => $this->ssl_apply_eligible
        ];
    }
}
