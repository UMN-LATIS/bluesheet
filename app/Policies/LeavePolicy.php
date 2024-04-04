<?php

namespace App\Policies;

use App\Constants\Permissions;
use App\Leave;
use App\Library\UserService;
use App\User;

class LeavePolicy {
    private UserService $userService;

    function __construct() {
        $this->userService = new UserService();
    }

    public function viewAny(User $user): bool {
        return false;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Leave $leave): bool {
        if ($user->can(Permissions::VIEW_ANY_LEAVES)) {
            return true;
        }

        // a user can view their own leaves
        if ($leave->user_id === $user->id) {
            return true;
        }

        // a group manager should be able to view the leaves
        // of other members of their group
        if ($user->managesAnyGroupWithMember($leave->user)) {
            return true;
        }

        if ($this->userService->doesUserManageAnyGroupWithInstructor($user, $leave->user)) {
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool {
        if ($user->can(Permissions::EDIT_ANY_LEAVES)) {
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Leave $leave): bool {
        if ($user->can(Permissions::EDIT_ANY_LEAVES)) {
            return true;
        }

        if ($user->managesAnyGroupWithMember($leave->user)) {
            return true;
        }

        if ($this->userService->doesUserManageAnyGroupWithInstructor($user, $leave->user)) {
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Leave $leave): bool {
        if ($user->can(Permissions::EDIT_ANY_LEAVES)) {
            return true;
        }

        if ($user->managesAnyGroupWithMember($leave->user)) {
            return true;
        }

        if ($this->userService->doesUserManageAnyGroupWithInstructor($user, $leave->user)) {
            return true;
        }

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
     * Determine whether the current user can view all leaves
     * of another user.
     */
    public function viewAnyLeavesForUser(User $currentUser, User $leaveOwner): bool {
        if ($currentUser->can(Permissions::VIEW_ANY_LEAVES)) {
            return true;
        }

        if ($leaveOwner->id === $currentUser->id) {
            return true;
        }

        if ($currentUser->managesAnyGroupWithMember($leaveOwner)) {
            return true;
        }

        if ($this->userService->doesUserManageAnyGroupWithInstructor($currentUser, $leaveOwner)) {
            return true;
        }

        return false;
    }

    /**
     * Determine whether the current user can create leaves
     * for another user.
     */
    public function createLeavesForUser(User $currentUser, User $leaveOwner): bool {
        if ($currentUser->can(Permissions::EDIT_ANY_LEAVES)) {
            return true;
        }

        if ($currentUser->managesAnyGroupWithMember($leaveOwner)) {
            return true;
        }

        if ($this->userService->doesUserManageAnyGroupWithInstructor($currentUser, $leaveOwner)) {
            return true;
        }

        return false;
    }
}
