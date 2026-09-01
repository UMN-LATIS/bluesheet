<?php

namespace App\Http\Resources\Sis;

use Illuminate\Http\Resources\Json\JsonResource;

class SisTermResource extends JsonResource {
    public function toArray($request) {
        return [
            'id' => $this->term_code,
            'name' => $this->description,
            'startDate' => $this->begins_on?->toDateString(),
            'endDate' => $this->ends_on?->toDateString(),
        ];
    }
}
