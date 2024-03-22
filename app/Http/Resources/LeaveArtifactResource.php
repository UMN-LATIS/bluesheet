<?php

namespace App\Http\Resources;

use App\LeaveArtifact;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeaveArtifactResource extends JsonResource {
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array {
        return [
            'id' => $this->id,
            'label' => $this->label,
            'target' => $this->target,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'currentUserCan' => [
                'update' => $request->user()->can('update', $this->resource),
                'delete' => $request->user()->can('delete', $this->resource),
                'view' => $request->user()->can('view', $this->resource),
                'viewAny' => $request->user()->can('viewAny', [LeaveArtifact::class, $this->resource->leave])
            ]
        ];
    }
}
