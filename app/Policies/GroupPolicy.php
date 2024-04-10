<?php

namespace App\Policies;

use App\Constants\Permissions;
use App\User;
use App\Group;
use Illuminate\Auth\Access\HandlesAuthorization;

class GroupPolicy
{
    use HandlesAuthorization;

    /**
     * Create a new policy instance.
     *
     * @return void
     */
    public function __construct()
    {
        //
    }

    public function view(?User $user, Group $group)
    {
        // visitors cannot view groups
        if ($user === null) {
            return false;
        }

        // admin overrides published status
        if ($user->can('view groups')) {
            return true;
        }

        // TODO: validate codes?

        // authors can view their own unpublished posts
        return $group->activeUsers()->pluck("id")->contains($user->id);
    }

    public function update(User $user, Group $group)
    {
        return $user->can(Permissions::EDIT_GROUPS)
            || $user->managesGroup($group);
    }

    public function delete(User $user, Group $group)
    {
        if($group->userCanEdit($user)) {
            return true;
        }

        if ($user->can('edit groups')) {
            return true;
        }
    }

    public function create(User $user, ?Group $maybeParentGroup)
    {
        return $user->can(Permissions::CREATE_GROUPS)
            || ($maybeParentGroup && $user->managesGroup($maybeParentGroup));
    }
}
