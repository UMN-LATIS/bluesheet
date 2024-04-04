<?php

namespace App\Policies;

use App\Constants\Permissions;
use App\LeaveArtifact;
use App\User;
use App\Leave;
use App\Library\UserService;
use Illuminate\Auth\Access\HandlesAuthorization;
use Illuminate\Auth\Access\Response;

class LeaveArtifactPolicy {

    use HandlesAuthorization;

    protected UserService $userService;

    public function __construct() {
        $this->userService = new UserService();
    }

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user, Leave $leave): bool {
        if ($leave->user_id === $user->id) {
            return true;
        }

        // users with explicit `view leaves` permission can see all leaves
        if ($user->can(Permissions::VIEW_ANY_LEAVES)) {
            return true;
        }

        // a group manager should be able to view the leaves
        // of any member of their group
        if ($user->managesAnyGroupWithMember($leave->user)) {
            return true;
        }

        if ($this->userService->doesUserManageAnyGroupWithInstructor($user, $leave->user)) {
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $currentUser, LeaveArtifact $leaveArtifact): bool {
        // users can see their own leaves
        if ($currentUser->id === $leaveArtifact->leave->user_id) {
            return true;
        }

        // users with explicit `view leaves` permission can see all leaves
        if ($currentUser->can(Permissions::VIEW_ANY_LEAVES)) {
            return true;
        }

        // a group manager should be able to view the leaves
        // of any member of their group
        if ($currentUser->managesAnyGroupWithMember($leaveArtifact->leave->user)) {
            return true;
        }

        if ($this->userService->doesUserManageAnyGroupWithInstructor($currentUser, $leaveArtifact->leave->user)) {
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user, Leave $leave): bool {
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
     * Determine whether the user can update the model.
     */
    public function update(User $user, LeaveArtifact $leaveArtifact): bool {
        if ($user->can(Permissions::EDIT_ANY_LEAVES)) {
            return true;
        }

        if ($user->managesAnyGroupWithMember($leaveArtifact->leave->user)) {
            return true;
        }


        if ($this->userService->doesUserManageAnyGroupWithInstructor($user, $leaveArtifact->leave->user)) {
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $currentUser, LeaveArtifact $leaveArtifact): bool {
        if ($currentUser->can(Permissions::EDIT_ANY_LEAVES)) {
            return true;
        }

        // a group manager should be able to edit the leaves
        // of any member of their group
        if ($currentUser->managesAnyGroupWithMember($leaveArtifact->leave->user)) {
            return true;
        }


        if ($this->userService->doesUserManageAnyGroupWithInstructor($currentUser, $leaveArtifact->leave->user)) {
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, LeaveArtifact $leaveArtifact): bool {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, LeaveArtifact $leaveArtifact): bool {
        return false;
    }
}
