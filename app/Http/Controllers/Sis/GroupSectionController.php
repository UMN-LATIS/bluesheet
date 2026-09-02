<?php

namespace App\Http\Controllers\Sis;

use App\Course;
use App\Group;
use App\Http\Controllers\Controller;
use App\Http\Resources\Sis\SisSectionResource;
use App\SisClassSection;
use Illuminate\Http\Request;

class GroupSectionController extends Controller {
    public function index(Request $request, Group $group) {
        $this->authorize('viewAnyCoursesForGroup', [Course::class, $group]);

        $validated = $request->validate([
            'term' => 'required|integer',
        ]);

        if ($group->sis_dept_id === null) {
            return SisSectionResource::collection([]);
        }

        $sections = SisClassSection::query()
            ->forDepartmentTerm((int) $group->sis_dept_id, $validated['term'])
            ->where('is_cancelled', false)
            // independent study: one untimed placeholder per instructor,
            // nothing a grid can plan
            ->where('component', '!=', 'IND')
            ->with(['meetings', 'instructors.employee'])
            ->orderBy('subject')
            ->orderBy('catalog_number')
            ->orderBy('class_section')
            ->get();

        return SisSectionResource::collection($sections);
    }
}
