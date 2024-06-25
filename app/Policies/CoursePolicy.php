<?php

namespace App\Policies;

use App\User;
use App\Group;
use App\Constants\Permissions;

class CoursePolicy {

    public function viewAnyCoursesForGroup(User $currentUser, Group $group) {
        return $currentUser->can(Permissions::VIEW_PLANNED_COURSES)
            || $currentUser->managesGroup($group);
    }

    public function editAnyCoursesForGroup(User $user, Group $group) {
        return $user->can(Permissions::EDIT_PLANNED_COURSES)
            || $user->managesGroup($group);
    }
}
