<?php

namespace App\Http\Controllers\Sis;

use App\Course;
use App\Group;
use App\Http\Controllers\Controller;
use App\Http\Resources\Sis\SisTermResource;
use App\SisClassSection;
use App\SisTerm;

class GroupTermController extends Controller {
    public function index(Group $group) {
        $this->authorize('viewAnyCoursesForGroup', [Course::class, $group]);

        if ($group->sis_dept_id === null) {
            return SisTermResource::collection([]);
        }

        $offered = SisClassSection::query()
            ->where('academic_org', (int) $group->sis_dept_id)
            ->where('is_cancelled', false)
            ->where('component', '!=', 'IND')
            ->distinct()
            ->pluck('term_code');

        $terms = SisTerm::undergrad()
            ->whereIn('term_code', $offered)
            ->orderByDesc('term_code')
            ->get();

        return SisTermResource::collection($terms);
    }
}
