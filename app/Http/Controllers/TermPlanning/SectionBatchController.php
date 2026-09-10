<?php

namespace App\Http\Controllers\TermPlanning;

use App\Course;
use App\Group;
use App\Http\Controllers\Controller;
use App\Http\Resources\TermPlanning\LocalSectionResource;
use App\Library\TermPlan\ImportOptions;
use App\Library\TermPlan\SectionCopy;
use App\Library\TermPlan\SectionNumberer;
use App\Library\TermPlan\TermLock;
use App\LocalClassInstructor;
use App\LocalClassMeeting;
use App\LocalClassSection;
use App\SisClassMeeting;
use App\SisClassSection;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class SectionBatchController extends Controller {
    public function store(Request $request, Group $group) {
        $validated = $request->validate([
            'termId' => 'required|integer',
            'sourceTermId' => 'required|integer',
            'sectionIds' => 'required|array|min:1',
            'sectionIds.*' => 'required|integer',
            'include' => 'sometimes|array',
            'include.instructors' => 'sometimes|boolean',
            'include.tas' => 'sometimes|boolean',
            'include.meetingTimes' => 'sometimes|boolean',
            'include.sectionNumbers' => 'sometimes|boolean',
        ]);

        $this->authorize('editAnyCoursesForGroup', [Course::class, $group]);
        abort_if($group->sis_dept_id === null, 403, 'This group has no department to plan for.');

        $academicOrg = (int) $group->sis_dept_id;
        abort_if(
            TermLock::isReadOnly($academicOrg, $validated['termId']),
            403,
            'The SIS has published this term, so it can no longer be planned here.'
        );

        $options = ImportOptions::from($validated['include'] ?? []);

        $sources = SisClassSection::query()
            ->forDepartmentTerm($academicOrg, $validated['sourceTermId'])
            ->whereIn('id', $validated['sectionIds'])
            ->where('is_cancelled', false)
            ->where('component', '!=', 'IND')
            ->with(['meetings', 'instructors'])
            ->get();

        abort_if($sources->isEmpty(), 422, 'None of those sections are in that term.');

        $created = DB::transaction(
            fn() => $this->copyInto($sources, $academicOrg, $validated['termId'], $options)
        );

        return LocalSectionResource::collection($this->reload($created));
    }

    public function destroy(Request $request, Group $group) {
        $validated = $request->validate([
            'termId' => 'required|integer',
            'sectionIds' => 'required|array|min:1',
            'sectionIds.*' => 'required|integer',
        ]);

        $this->authorize('editAnyCoursesForGroup', [Course::class, $group]);
        abort_if($group->sis_dept_id === null, 403, 'This group has no department to plan for.');

        $academicOrg = (int) $group->sis_dept_id;
        abort_if(
            TermLock::isReadOnly($academicOrg, $validated['termId']),
            403,
            'The SIS has published this term, so it can no longer be planned here.'
        );

        LocalClassSection::query()
            ->forDepartmentTerm($academicOrg, $validated['termId'])
            ->whereIn('id', $validated['sectionIds'])
            ->get()
            ->each->delete();

        return response()->noContent();
    }

    private function copyInto(
        Collection $sources,
        int $academicOrg,
        int $termCode,
        ImportOptions $options,
    ): Collection {
        $numbers = $this->numbersBySourceId($sources, $academicOrg, $termCode, $options);
        $meetingRows = [];
        $instructorRows = [];
        $now = now();

        $sections = $sources->map(function (SisClassSection $source) use (
            $numbers,
            $academicOrg,
            $termCode,
            $options,
            $now,
            &$meetingRows,
            &$instructorRows
        ) {
            $section = LocalClassSection::create([
                ...SectionCopy::toColumns($source, $numbers[$source->id], $options),
                'term_code' => $termCode,
                'academic_org' => $academicOrg,
                'created_by' => auth()->id(),
                'updated_by' => auth()->id(),
            ]);

            if ($options->meetingTimes) {
                foreach (SectionCopy::timedMeetings($source) as $meeting) {
                    $meetingRows[] = [
                        'local_class_section_id' => $section->id,
                        'starts_at' => $meeting->starts_at,
                        'ends_at' => $meeting->ends_at,
                        ...self::daysOf($meeting),
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }
            }

            foreach ($source->instructors as $instructor) {
                if (!$options->includesRole($instructor->role)) {
                    continue;
                }

                $instructorRows[] = [
                    'local_class_section_id' => $section->id,
                    'emplid' => $instructor->emplid,
                    'role' => $instructor->role,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            return $section;
        });

        LocalClassMeeting::insert($meetingRows);
        LocalClassInstructor::insert($instructorRows);

        return $sections;
    }

    private function numbersBySourceId(
        Collection $sources,
        int $academicOrg,
        int $termCode,
        ImportOptions $options,
    ): array {
        $taken = LocalClassSection::query()
            ->forDepartmentTerm($academicOrg, $termCode)
            ->get(['course_code', 'class_section'])
            ->groupBy('course_code')
            ->map(fn(Collection $rows) => $rows->pluck('class_section')->all());

        $numbers = [];
        foreach ($sources->groupBy('course_code') as $courseCode => $course) {
            $assigned = $options->sectionNumbers
                ? SectionNumberer::assignWithinCourse(
                    $taken[$courseCode] ?? [],
                    $course->pluck('class_section')->all(),
                )
                : SectionNumberer::placeholdersWithinCourse(
                    $taken[$courseCode] ?? [],
                    $course->count(),
                );

            foreach ($course->values() as $position => $source) {
                $numbers[$source->id] = $assigned[$position];
            }
        }

        return $numbers;
    }

    private static function daysOf(SisClassMeeting $meeting): array {
        return collect(SisClassMeeting::DAY_COLUMNS)
            ->mapWithKeys(fn(string $column) => [$column => $meeting->$column])
            ->all();
    }

    private function reload(Collection $sections): Collection {
        return LocalClassSection::query()
            ->whereIn('id', $sections->pluck('id'))
            ->with(['meetings', 'instructors.employee'])
            ->orderBy('subject')
            ->orderBy('catalog_number')
            ->orderBy('class_section')
            ->get();
    }
}
