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
        return $this->viewAnyLeavesForUser($user, $leave->user);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool {
        return $user->can(Permissions::EDIT_ANY_LEAVES);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Leave $leave): bool {
        return $this->modifyLeavesForUser($user, $leave->user);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Leave $leave): bool {
        return $this->modifyLeavesForUser($user, $leave->user);
    }

    /**
     * Determine whether the current user can view all leaves
     * of another user.
     */
    public function viewAnyLeavesForUser(User $currentUser, User $leaveOwner): bool {
        return $currentUser->can(Permissions::VIEW_ANY_LEAVES)
            || ($leaveOwner->id === $currentUser->id)
            || $currentUser->managesAnyGroupWithMember($leaveOwner)
            || $this->userService->doesUserManageAnyGroupWithInstructor($currentUser, $leaveOwner);
    }

    /**
     * Determine whether the current user can create leaves
     * for another user.
     */
    public function modifyLeavesForUser(User $currentUser, User $leaveOwner): bool {
        return $currentUser->can(Permissions::EDIT_ANY_LEAVES)
            || $currentUser->managesAnyGroupWithMember($leaveOwner)
            || $this->userService->doesUserManageAnyGroupWithInstructor($currentUser, $leaveOwner);
    }
}
