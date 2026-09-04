<?php

namespace App\Http\Controllers\TermPlanning;

use App\Course;
use App\Group;
use App\Http\Controllers\Controller;
use App\Http\Resources\TermPlanning\LocalSectionResource;
use App\Library\TermPlan\MeetingShape;
use App\Library\TermPlan\TermLock;
use App\LocalClassSection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Unique;

/**
 * The sections a department has planned for a term the SIS has not published.
 *
 * Permission and term lock are checked on every write. What the page shows is
 * a courtesy: a keyboard shortcut, a deep link, or a tab left open since
 * before the registrar published the term all still reach these endpoints.
 */
class GroupSectionController extends Controller {
    /** Delivery values the front end's Delivery type allows. */
    private const DELIVERIES = ['onCampus', 'blended', 'online'];

    private const DAY_NAMES = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

    public function index(Request $request, Group $group) {
        $this->authorize('viewAnyCoursesForGroup', [Course::class, $group]);

        $termCode = (int) $request->validate(['term' => 'required|integer'])['term'];
        $academicOrg = $group->sis_dept_id === null ? null : (int) $group->sis_dept_id;

        $sections = $academicOrg === null
            ? collect()
            : LocalClassSection::query()
                ->forDepartmentTerm($academicOrg, $termCode)
                ->with(['meetings', 'instructors.employee'])
                ->orderBy('subject')
                ->orderBy('catalog_number')
                ->orderBy('class_section')
                ->get();

        return [
            // the client mirrors this in termLock.ts rather than deciding for itself
            'isEditable' => TermLock::isEditable($academicOrg, $termCode),
            'sections' => LocalSectionResource::collection($sections),
        ];
    }

    public function store(Request $request, Group $group) {
        $academicOrg = $this->authorizeWrite($request, $group);
        $validated = $request->validate($this->rules($request));

        $section = DB::transaction(function () use ($validated, $academicOrg) {
            $section = LocalClassSection::create([
                ...$this->toColumns($validated),
                'term_code' => $validated['termId'],
                'academic_org' => $academicOrg,
                'created_by' => auth()->id(),
                'updated_by' => auth()->id(),
            ]);

            $this->replaceMeetingsAndInstructors($section, $validated);

            return $section;
        });

        return (new LocalSectionResource($this->reload($section)))
            ->response()
            ->setStatusCode(201);
    }

    public function update(Request $request, Group $group, LocalClassSection $section) {
        $academicOrg = $this->authorizeWrite($request, $group, $section->term_code);
        $this->assertBelongsToDepartment($section, $academicOrg);

        // a section cannot be moved to another term: that would be planning a
        // term whose lock was never checked. Refused before validating, so
        // nothing is checked against a term the section is not in.
        abort_if(
            (int) $request->input('termId') !== $section->term_code,
            422,
            'A section cannot be moved to another term.'
        );

        $validated = $request->validate($this->rules($request, $section));

        DB::transaction(function () use ($section, $validated) {
            $section->update([
                ...$this->toColumns($validated),
                'updated_by' => auth()->id(),
            ]);

            $this->replaceMeetingsAndInstructors($section, $validated);
        });

        return new LocalSectionResource($this->reload($section));
    }

    public function destroy(Request $request, Group $group, LocalClassSection $section) {
        $academicOrg = $this->authorizeWrite($request, $group, $section->term_code);
        $this->assertBelongsToDepartment($section, $academicOrg);

        $section->delete();

        return response()->noContent();
    }

    /**
     * Edit permission plus an unpublished term, in that order. Returns the
     * department, which every write needs anyway.
     *
     * The term comes from the request on a create and from the section itself
     * on a delete, because a delete carries no body.
     */
    private function authorizeWrite(Request $request, Group $group, ?int $termCode = null): int {
        $this->authorize('editAnyCoursesForGroup', [Course::class, $group]);

        if ($group->sis_dept_id === null) {
            abort(403, 'This group has no department to plan for.');
        }

        $academicOrg = (int) $group->sis_dept_id;
        $termCode ??= (int) $request->input('termId');

        if (TermLock::isReadOnly($academicOrg, $termCode)) {
            abort(403, 'The SIS has published this term, so it can no longer be planned here.');
        }

        return $academicOrg;
    }

    /**
     * A section id from another department is a 404 rather than a 403: the
     * caller has edit rights on the group they named, and the section simply
     * is not one of that group's.
     */
    private function assertBelongsToDepartment(LocalClassSection $section, int $academicOrg): void {
        abort_if($section->academic_org !== $academicOrg, 404);
    }

    /** @return array<string, mixed> */
    private function rules(Request $request, ?LocalClassSection $existing = null): array {
        return [
            'termId' => 'required|integer',
            'courseCode' => 'required|string|max:255',
            'subject' => 'required|string|max:255',
            'catalogNumber' => 'required|string|max:255',
            'section' => [
                'required', 'string', 'max:255',
                $this->sectionNumberIsFree($request, $existing),
            ],
            'component' => 'required|string|max:255',
            'title' => 'required|string|max:255',
            'credits' => 'nullable|integer|min:0',
            'enrollmentCap' => 'nullable|integer|min:0',
            'delivery' => 'required|string|in:' . implode(',', self::DELIVERIES),
            'notes' => 'nullable|string',
            'isCancelled' => 'nullable|boolean',

            'meetings' => 'present|array',
            'meetings.*.days' => 'required|array',
            'meetings.*.days.*' => 'required|string|in:' . implode(',', self::DAY_NAMES),
            'meetings.*.startTime' => 'required|date_format:H:i',
            'meetings.*.endTime' => 'required|date_format:H:i|after:meetings.*.startTime',

            'instructors' => 'present|array',
            'instructors.*.emplid' => 'required|integer',
            'instructors.*.role' => 'required|string|max:255',
        ];
    }

    /**
     * One section number per course per term, which is the key the local table
     * enforces. Checking it here turns a duplicate into a message the form can
     * show instead of a constraint violation.
     *
     * A deleted section does not hold its number, matching the unique key,
     * which counts deleted_at so a number can be used again.
     */
    private function sectionNumberIsFree(Request $request, ?LocalClassSection $existing): Unique {
        $rule = Rule::unique('local_class_sections', 'class_section')
            ->where('term_code', $request->input('termId'))
            ->where('course_code', $request->input('courseCode'))
            ->whereNull('deleted_at');

        return $existing === null ? $rule : $rule->ignore($existing);
    }

    /** @return array<string, mixed> */
    private function toColumns(array $validated): array {
        return [
            'course_code' => $validated['courseCode'],
            'subject' => $validated['subject'],
            'catalog_number' => $validated['catalogNumber'],
            'class_section' => $validated['section'],
            'component' => $validated['component'],
            'title' => $validated['title'],
            'credits' => $validated['credits'] ?? null,
            'enrollment_cap' => $validated['enrollmentCap'] ?? 0,
            'delivery' => $validated['delivery'],
            'notes' => $validated['notes'] ?? null,
            'is_cancelled' => $validated['isCancelled'] ?? false,
        ];
    }

    /**
     * Meetings and instructors arrive as the whole list, not as a diff, so
     * they are replaced rather than reconciled. A section carries at most a
     * handful of each, and matching them up by hand would buy nothing.
     */
    private function replaceMeetingsAndInstructors(LocalClassSection $section, array $validated): void {
        $section->meetings()->delete();
        foreach ($validated['meetings'] as $meeting) {
            $section->meetings()->create([
                'starts_at' => $meeting['startTime'],
                'ends_at' => $meeting['endTime'],
                ...MeetingShape::toDayColumns($meeting['days']),
            ]);
        }

        $section->instructors()->delete();
        // the same person in the same role twice is a duplicate, not an error
        // worth refusing the whole save over
        $instructors = collect($validated['instructors'])
            ->unique(fn(array $i) => $i['emplid'] . '-' . $i['role']);
        foreach ($instructors as $instructor) {
            $section->instructors()->create([
                'emplid' => $instructor['emplid'],
                'role' => $instructor['role'],
            ]);
        }
    }

    private function reload(LocalClassSection $section): LocalClassSection {
        return $section->fresh(['meetings', 'instructors.employee']);
    }
}
