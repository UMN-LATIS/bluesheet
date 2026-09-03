<?php

namespace App\Http\Controllers\Sis;

use App\Course;
use App\Group;
use App\Http\Controllers\Controller;
use App\Http\Resources\Sis\SisCourseResource;
use App\SisClassSection;
use Illuminate\Database\Eloquent\Collection;

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

        $courses = self::latestOfferings((int) $group->sis_dept_id)
            ->sortBy(fn(SisClassSection $section) => [
                $section->subject,
                $section->catalog_number,
                $section->component,
            ])
            ->values();

        return SisCourseResource::collection($courses);
    }

    /**
     * The newest section of each course and component, one row apiece. Ranked
     * in the database rather than deduplicated here, because a department's
     * history runs to every section of every term and all but a handful of
     * those rows would be read only to be discarded.
     *
     * @return Collection<int, SisClassSection>
     */
    private static function latestOfferings(int $academicOrg): Collection {
        $ranked = SisClassSection::query()
            ->where('academic_org', $academicOrg)
            ->where('is_cancelled', false)
            ->select('subject', 'catalog_number', 'title', 'component', 'credits', 'term_code')
            // class_number only breaks ties, so that two sections of one course
            // in the same term cannot each claim to be the newest.
            ->selectRaw('ROW_NUMBER() OVER (
                PARTITION BY subject, catalog_number, component
                ORDER BY term_code DESC, class_number
            ) AS offering_rank');

        return SisClassSection::query()
            ->fromSub($ranked, 'offerings')
            ->where('offering_rank', 1)
            ->get();
    }
}
