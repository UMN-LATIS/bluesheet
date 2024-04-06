<?php

namespace App\Policies;

use App\User;
use App\Group;
use App\Constants\Permissions;

class EnrollmentPolicy {
    protected CoursePolicy $coursePolicy;

    public function __construct() {
        $this->coursePolicy = new CoursePolicy();
    }

    public function viewAnyEnrollmentsForGroup(User $currentUser, Group $group) {
        return $this->coursePolicy->viewAnyCoursesForGroup($currentUser, $group);
    }

    public function editAnyEnrollmentsForGroup(User $user, Group $group) {
        return $this->coursePolicy->editAnyCoursesForGroup($user, $group);
    }
}
