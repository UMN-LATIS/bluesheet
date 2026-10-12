<?php

namespace App\Http\Controllers\Remote;

use App\Http\Controllers\Controller;
use App\Role;

class RoleController extends Controller {
    public function index() {
        return Role::select(['id', 'label'])
            ->withExists('officialGroupType as is_official')
            ->withCount(['members as current_holder_count' => fn($query) => $query->currentHolder()])
            ->orderBy('label')
            ->get();
    }
}
