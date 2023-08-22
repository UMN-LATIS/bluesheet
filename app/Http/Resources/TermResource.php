<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class TermResource extends JsonResource {
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array|\Illuminate\Contracts\Support\Arrayable|\JsonSerializable
     */
    public function toArray($request) {
        return [
            'id' => $this->TERM,
            'name' => $this->TERM_DESCRIPTION,
            'startDate' => $this->TERM_BEGIN_DT,
            'endDate' => $this->TERM_END_DT,
        ];
    }
}
