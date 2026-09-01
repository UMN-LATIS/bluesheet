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
     * Every course a group's department has ever taught, for the filter
     * sidebar and the section picker.
     *
     * A course is identified by its code and component together, because
     * one course commonly offers both lectures and discussions and they are
     * scheduled as separate things. Title and credits drift over the years,
     * so the most recent offering speaks for the course.
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
     * @return Collection<SisClassSection>
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
