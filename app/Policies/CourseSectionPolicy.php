<?php

namespace App\Policies;

use App\User;
use App\Group;
use App\Constants\Permissions;

class CourseSectionPolicy {

    protected CoursePolicy $coursePolicy;

    public function __construct() {
        $this->coursePolicy = new CoursePolicy();
    }

    public function viewAnySectionsForGroup(User $currentUser, Group $group) {
        return $this->coursePolicy->viewAnyCoursesForGroup($currentUser, $group);
    }

    public function editAnySectionsForGroup(User $user, Group $group) {
        return $this->coursePolicy->editAnyCoursesForGroup($user, $group);
    }
}
