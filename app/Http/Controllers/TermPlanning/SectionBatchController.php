<?php

namespace App\Http\Controllers\TermPlanning;

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
use App\LocalCourse;
use App\SisClassMeeting;
use App\SisClassSection;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class SectionBatchController extends Controller {
    public function store(Request $request, Group $group) {
        $validated = $request->validate([
            'termCode' => 'required|integer',
            'sourceTermCode' => 'required|integer',
            'sectionIds' => 'required|array|min:1',
            'sectionIds.*' => 'required|integer',
            'include' => 'sometimes|array',
            'include.instructors' => 'sometimes|boolean',
            'include.tas' => 'sometimes|boolean',
            'include.meetingTimes' => 'sometimes|boolean',
            'include.sectionNumbers' => 'sometimes|boolean',
        ]);

        $this->authorize('editAnyCoursesForGroup', [LocalCourse::class, $group]);
        abort_if($group->sis_dept_id === null, 403, 'This group has no department to plan for.');

        $academicOrg = (int) $group->sis_dept_id;
        abort_if(
            TermLock::isReadOnly($academicOrg, $validated['termCode']),
            403,
            'The SIS has published this term, so it can no longer be planned here.'
        );

        $options = ImportOptions::fromRequestInclude($validated['include'] ?? []);

        $sources = SisClassSection::query()
            ->forDepartmentTerm($academicOrg, $validated['sourceTermCode'])
            ->whereIn('id', $validated['sectionIds'])
            ->where('is_cancelled', false)
            ->where('component', '!=', 'IND')
            ->with(['meetings', 'instructors'])
            ->get();

        abort_if($sources->isEmpty(), 422, 'None of those sections are in that term.');

        $created = DB::transaction(
            fn() => $this->copyInto($sources, $academicOrg, $validated['termCode'], $options)
        );

        return LocalSectionResource::collection($this->reload($created));
    }

    public function destroy(Request $request, Group $group) {
        $validated = $request->validate([
            'termCode' => 'required|integer',
            'sectionIds' => 'required|array|min:1',
            'sectionIds.*' => 'required|integer',
        ]);

        $this->authorize('editAnyCoursesForGroup', [LocalCourse::class, $group]);
        abort_if($group->sis_dept_id === null, 403, 'This group has no department to plan for.');

        $academicOrg = (int) $group->sis_dept_id;
        abort_if(
            TermLock::isReadOnly($academicOrg, $validated['termCode']),
            403,
            'The SIS has published this term, so it can no longer be planned here.'
        );

        // Keep the per-model loop: a mass delete skips
        // the `deleted` event and Auditable logs nothing.
        DB::transaction(
            fn() => LocalClassSection::query()
                ->forDepartmentTerm($academicOrg, $validated['termCode'])
                ->whereIn('id', $validated['sectionIds'])
                ->get()
                ->each->delete()
        );

        return response()->noContent();
    }

    private function copyInto(
        Collection $sources,
        int $academicOrg,
        int $termCode,
        ImportOptions $options,
    ): Collection {
        $numbers = $this->numbersBySourceId($sources, $academicOrg, $termCode, $options);
        $now = now();

        $sections = collect();
        $meetingRows = [];
        $instructorRows = [];

        foreach ($sources as $source) {
            $section = LocalClassSection::create([
                ...SectionCopy::toColumns($source, $numbers[$source->id], $options),
                'term_code' => $termCode,
                'academic_org' => $academicOrg,
                'created_by' => auth()->id(),
                'updated_by' => auth()->id(),
            ]);

            $sections->push($section);
            array_push($meetingRows, ...self::meetingRowsFor($section, $source, $options, $now));
            array_push($instructorRows, ...self::instructorRowsFor($section, $source, $options, $now));
        }

        LocalClassMeeting::insert($meetingRows);
        LocalClassInstructor::insert($instructorRows);

        return $sections;
    }

    /** @return array<int, array<string, mixed>> */
    private static function meetingRowsFor(
        LocalClassSection $section,
        SisClassSection $source,
        ImportOptions $options,
        Carbon $now,
    ): array {
        if (!$options->meetingTimes) {
            return [];
        }

        return SectionCopy::timedMeetings($source)
            ->map(fn(SisClassMeeting $meeting) => [
                'local_class_section_id' => $section->id,
                'starts_at' => $meeting->starts_at,
                'ends_at' => $meeting->ends_at,
                ...self::daysOf($meeting),
                'created_at' => $now,
                'updated_at' => $now,
            ])
            ->values()
            ->all();
    }

    /** @return array<int, array<string, mixed>> */
    private static function instructorRowsFor(
        LocalClassSection $section,
        SisClassSection $source,
        ImportOptions $options,
        Carbon $now,
    ): array {
        return collect($source->instructors)
            ->filter(fn($instructor) => $options->includesRole($instructor->role))
            ->map(fn($instructor) => [
                'local_class_section_id' => $section->id,
                'emplid' => $instructor->emplid,
                'role' => $instructor->role,
                'created_at' => $now,
                'updated_at' => $now,
            ])
            ->values()
            ->all();
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
        foreach ($sources->groupBy('course_code') as $courseCode => $courseSections) {
            $alreadyHeld = $taken[$courseCode] ?? [];

            if ($options->sectionNumbers) {
                $assigned = SectionNumberer::assignWithinCourse(
                    $alreadyHeld,
                    $courseSections->pluck('class_section')->all(),
                );
            } else {
                $assigned = SectionNumberer::placeholdersWithinCourse(
                    $alreadyHeld,
                    $courseSections->count(),
                );
            }

            foreach ($courseSections->values() as $position => $source) {
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
