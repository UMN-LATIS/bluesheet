<?php

namespace App\Policies;

use App\User;
use App\Group;
use App\Constants\Permissions;

class CoursePolicy {

    public function viewAnyCoursesForGroup(User $currentUser, Group $group) {
        if ($currentUser->can(Permissions::VIEW_PLANNED_COURSES)) {
            return true;
        }

        if ($currentUser->managesGroup($group)) {
            return true;
        }

        return false;
    }

    public function editAnyCoursesForGroup(User $user, Group $group) {
        if ($user->can(Permissions::EDIT_PLANNED_COURSES)) {
            return true;
        }

        if ($user->managesGroup($group)) {
            return true;
        }

        return false;
    }
}
