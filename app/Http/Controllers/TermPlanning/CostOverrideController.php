<?php

namespace App\Http\Controllers\TermPlanning;

use App\Group;
use App\Http\Controllers\Controller;
use App\Library\TermPlan\TermCode;
use App\Library\TermPlan\TermLock;
use App\LocalCourse;
use App\TermGradPerson;
use App\TermPersonInput;
use App\TermPersonRateOverride;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CostOverrideController extends Controller {
    private const MONEY_RULES = ['numeric', 'decimal:0,2', 'min:0', 'max:99999999.99'];

    private const PERSON_INPUT_COLUMN_BY_KEY = [
        'notes' => 'notes',
        'yearStarted' => 'year_started',
        'courseReleases' => 'course_releases',
        'releaseSource' => 'release_source',
    ];

    public function updatePersonRate(Request $request, Group $group, string $emplid) {
        $academicOrg = $this->authorizeAndFindAcademicOrg($group);
        $termCode = TermCode::fromRequest($request);
        $this->abortIfTermIsReadOnly($academicOrg, $termCode);
        $emplid = $this->emplidOrNotFound($emplid);

        $validated = $request->validate([
            'salary' => ['present', 'nullable', ...self::MONEY_RULES],
        ])['salary'];
        $salary = $validated === null ? null : (float) $validated;

        $this->saveOrDelete(
            TermPersonRateOverride::class,
            ['academic_org' => $academicOrg, 'term_code' => $termCode, 'emplid' => $emplid],
            $salary === null ? null : ['salary' => $salary],
        );

        return ['emplid' => $emplid, 'salary' => $salary];
    }

    public function updateGradPerson(Request $request, Group $group, string $emplid) {
        $academicOrg = $this->authorizeAndFindAcademicOrg($group);
        $termCode = TermCode::fromRequest($request);
        $this->abortIfTermIsReadOnly($academicOrg, $termCode);
        $emplid = $this->emplidOrNotFound($emplid);

        $validated = $request->validate([
            'hasFeeOffset' => ['present', 'boolean'],
            'isInternational' => ['present', 'boolean'],
        ]);
        $hasFeeOffset = (bool) $validated['hasFeeOffset'];
        $isInternational = (bool) $validated['isInternational'];
        $isDefault = !$hasFeeOffset && !$isInternational;

        $this->saveOrDelete(
            TermGradPerson::class,
            ['academic_org' => $academicOrg, 'term_code' => $termCode, 'emplid' => $emplid],
            $isDefault ? null : [
                'has_fee_offset' => $hasFeeOffset,
                'is_international' => $isInternational,
            ],
        );

        return [
            'emplid' => $emplid,
            'hasFeeOffset' => $hasFeeOffset,
            'isInternational' => $isInternational,
        ];
    }

    public function updatePersonInputs(Request $request, Group $group, string $emplid) {
        $academicOrg = $this->authorizeAndFindAcademicOrg($group);
        $termCode = TermCode::fromRequest($request);
        $this->abortIfTermIsReadOnly($academicOrg, $termCode);
        $emplid = $this->emplidOrNotFound($emplid);

        if (!$request->hasAny(array_keys(self::PERSON_INPUT_COLUMN_BY_KEY))) {
            throw ValidationException::withMessages(['notes' => 'Send at least one person input.']);
        }

        $changes = $request->validate([
            'notes' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'releaseSource' => ['sometimes', 'nullable', 'string', 'max:255'],
            'yearStarted' => ['sometimes', 'nullable', 'integer', 'between:1950,2100'],
            'courseReleases' => ['sometimes', 'nullable', 'integer', 'between:0,20'],
        ]);

        $uniqueKey = ['academic_org' => $academicOrg, 'term_code' => $termCode, 'emplid' => $emplid];
        $saved = TermPersonInput::where($uniqueKey)->first();

        $inputs = [];
        foreach (self::PERSON_INPUT_COLUMN_BY_KEY as $key => $column) {
            $inputs[$key] = array_key_exists($key, $changes)
                ? $this->blankToNull($changes[$key])
                : $saved?->{$column};
        }

        $isEveryInputNull = count(array_filter($inputs, fn($input) => $input !== null)) === 0;
        $values = [];
        foreach (self::PERSON_INPUT_COLUMN_BY_KEY as $key => $column) {
            $values[$column] = $inputs[$key];
        }

        $this->saveOrDelete(TermPersonInput::class, $uniqueKey, $isEveryInputNull ? null : $values);

        return ['emplid' => $emplid, ...$inputs];
    }

    private function blankToNull(mixed $input): mixed {
        if (is_string($input)) {
            return trim($input) === '' ? null : trim($input);
        }

        return $input === null ? null : (int) $input;
    }

    private function abortIfTermIsReadOnly(int $academicOrg, int $termCode): void {
        abort_if(
            TermLock::isReadOnly($academicOrg, $termCode),
            403,
            'The SIS has published this term, so it can no longer be planned here.'
        );
    }

    private function emplidOrNotFound(string $emplid): int {
        abort_unless(ctype_digit($emplid) && (int) $emplid > 0 && strlen($emplid) <= 9, 404, 'An emplid is a positive whole number of at most nine digits.');

        return (int) $emplid;
    }

    private function authorizeAndFindAcademicOrg(Group $group): int {
        $this->authorize('editAnyCoursesForGroup', [LocalCourse::class, $group]);
        abort_if($group->sis_dept_id === null, 404, 'This group has no department to estimate costs for.');

        return (int) $group->sis_dept_id;
    }

    /**
     * A null `$values` deletes the row.
     *
     * @param class-string<Model> $overrideClass
     * @param array<string, mixed> $uniqueKey
     * @param array<string, mixed>|null $values
     */
    private function saveOrDelete(string $overrideClass, array $uniqueKey, ?array $values): void {
        if ($values === null) {
            // A query delete() fires no model event, so
            // laravel-auditing would record no deletion.
            $overrideClass::where($uniqueKey)->first()?->delete();

            return;
        }

        $override = $overrideClass::createOrFirst($uniqueKey, [
            ...$values,
            'created_by' => auth()->id(),
            'updated_by' => auth()->id(),
        ]);

        if (!$override->wasRecentlyCreated) {
            $override->update([...$values, 'updated_by' => auth()->id()]);
        }
    }
}
