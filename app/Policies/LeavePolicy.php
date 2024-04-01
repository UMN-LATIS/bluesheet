<?php

namespace App\Policies;

use App\Leave;
use App\User;
use Illuminate\Auth\Access\Response;

class LeavePolicy {
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool {
        return false;
    }
}
