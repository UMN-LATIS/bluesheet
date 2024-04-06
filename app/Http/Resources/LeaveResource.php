<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeaveResource extends JsonResource {
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array {
        return [
            'id' => $this->id,
            'description' => $this->description,
            'start_date' => $this->start_date,
            'end_date' => $this->end_date,
            'status' => $this->status,
            'type' => $this->type,
            'user_id' => $this->user_id,
            'user' => $this->whenLoaded('user', [
                'id' => $this->user->id,
                'givenname' => $this->user->givenname,
                'surname' => $this->user->surname,
                'displayName' => $this->user->displayName,
                'email' => $this->user->email,
                'emplid' => $this->user->emplid,
                'ou' => $this->user->ou,
                'title' => $this->user->title,
            ]),
            'terms' => TermResource::collection($this->whenNotNull($this->terms)),
            'artifacts' => LeaveArtifactResource::collection($this->whenLoaded('artifacts')),
            'canCurrentUser' => [
                'update' => $request->user()->can('update', $this->resource),
                'delete' => $request->user()->can('delete', $this->resource),
            ]
        ];
    }
}
