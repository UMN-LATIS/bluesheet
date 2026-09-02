<?php

namespace App\Http\Controllers\Sis;

use App\Course;
use App\Group;
use App\Http\Controllers\Controller;
use App\Http\Resources\Sis\SisCourseResource;
use App\SisClassSection;
use Illuminate\Support\Collection;

class GroupCourseController extends Controller {
    /**
     * Every course the department has ever taught, keyed by course code
     * and component, with title and credits from its latest offering.
     */
    public function index(Group $group) {
        $this->authorize('viewAnyCoursesForGroup', [Course::class, $group]);

        if ($group->sis_dept_id === null) {
            return SisCourseResource::collection([]);
        }

        $offerings = SisClassSection::query()
            ->where('academic_org', (int) $group->sis_dept_id)
            ->where('is_cancelled', false)
            ->orderByDesc('term_code')
            ->get(['subject', 'catalog_number', 'title', 'component', 'credits', 'term_code']);

        return SisCourseResource::collection(self::latestOfferings($offerings));
    }

    /**
     * @param Collection<SisClassSection> $offerings ordered most recent first
     */
    private static function latestOfferings(Collection $offerings): Collection {
        return $offerings
            ->unique(fn(SisClassSection $section) => $section->course_code . '-' . $section->component)
            ->sortBy(fn(SisClassSection $section) => [
                $section->subject,
                $section->catalog_number,
                $section->component,
            ])
            ->values();
    }
}
