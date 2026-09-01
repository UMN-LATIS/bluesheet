<?php

namespace App\Http\Controllers\Sis;

use App\Course;
use App\Group;
use App\Http\Controllers\Controller;
use App\Http\Resources\Sis\SisSectionResource;
use App\SisClassSection;
use Illuminate\Http\Request;

class GroupSectionController extends Controller {
    /**
     * The sections a group's department offers in one term, ready to draw
     * on the schedule grid.
     *
     * Cancelled sections are left out: a term that shows them looks fuller
     * than it is.
     */
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
            ->with(['meetings', 'instructors.employee'])
            ->orderBy('subject')
            ->orderBy('catalog_number')
            ->orderBy('class_section')
            ->get();

        return SisSectionResource::collection($sections);
    }
}
