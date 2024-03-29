<?php

namespace App\Policies;

use App\Constants\Permissions;
use App\Leave;
use App\User;

class LeavePolicy {

    public function viewAny(User $user): bool {
        return false;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Leave $leave): bool {
        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool {
        return false;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Leave $leave): bool {
        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Leave $leave): bool {
        return false;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Leave $leave): bool {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Leave $leave): bool {
        return false;
    }

    /**
     * Determine whether the current user can view all leaves of another user.
     */
    public function viewUserLeaves(User $currentUser, User $leaveOwner): bool {
        if ($currentUser->can(Permissions::VIEW_LEAVES)) {
            return true;
        }

        if ($leaveOwner->id === $currentUser->id) {
            return true;
        }

        return false;
    }
}
