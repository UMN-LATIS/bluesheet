<?php

namespace App\Library;

use App\User;
use Illuminate\Support\Collection;

class UserService {
    public function findOrCreateByEmplid(string $emplid): ?User {
        $user = User::where('emplid', $emplid)->first();
        if ($user) return $user;

        $user = LDAP::lookupUser($emplid, 'umnemplid');
        if (!$user) return null;

        $user->save();
        return $user;
    }

    public function attachInstructorsToCourses(Collection $courses): Collection {
        return $courses->each(function ($course) {
            if (!$course->INSTRUCTOR_EMPLID) return;

            $user = $this->findOrCreateByEmplid($course->INSTRUCTOR_EMPLID);

            $course->instructor = $user ?? null;
        });
    }
}
