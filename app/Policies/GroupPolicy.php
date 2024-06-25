<?php

namespace App\Policies;

use App\Constants\Permissions;
use App\User;
use App\Group;
use Illuminate\Auth\Access\HandlesAuthorization;

class GroupPolicy
{
    use HandlesAuthorization;

    public function view(?User $user, Group $group)
    {
        // visitors cannot view groups
        if ($user === null) {
            return false;
        }

        return $user->can(Permissions::VIEW_GROUPS)
            || $user->isMemberOf($group);
    }

    public function update(User $user, Group $group)
    {
        return $user->can(Permissions::EDIT_GROUPS)
            || $user->managesGroup($group);
    }

    public function delete(User $user, Group $group)
    {
        return $this->update($user, $group);
    }

    public function create(User $user, ?Group $maybeParentGroup)
    {
        return $user->can(Permissions::CREATE_GROUPS)
            || ($maybeParentGroup && $user->managesGroup($maybeParentGroup));
    }
}
