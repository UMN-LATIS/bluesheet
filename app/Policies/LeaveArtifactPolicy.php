<?php

namespace App\Policies;

use App\LeaveArtifact;
use App\User;
use App\Leave;
use App\Library\UserService;
use Illuminate\Auth\Access\HandlesAuthorization;

class LeaveArtifactPolicy {

    use HandlesAuthorization;

    protected UserService $userService;
    protected LeavePolicy $leavePolicy;

    public function __construct() {
        $this->userService = new UserService();
        $this->leavePolicy = new LeavePolicy();
    }

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user, Leave $leave): bool {
        return $this->leavePolicy->viewAnyLeavesForUser($user, $leave->user);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $currentUser, LeaveArtifact $leaveArtifact): bool {
        return $this->leavePolicy->viewAnyLeavesForUser($currentUser, $leaveArtifact->leave->user);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user, Leave $leave): bool {
        return $this->leavePolicy->modifyLeavesForUser($user, $leave->user);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, LeaveArtifact $leaveArtifact): bool {
        return $this->leavePolicy->modifyLeavesForUser($user, $leaveArtifact->leave->user);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $currentUser, LeaveArtifact $leaveArtifact): bool {
        return $this->leavePolicy->modifyLeavesForUser($currentUser, $leaveArtifact->leave->user);
    }
}
