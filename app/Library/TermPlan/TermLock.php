<?php

namespace App\Library\TermPlan;

use App\SisClassSection;
use Illuminate\Support\Collection;

/**
 * Who owns a term: the SIS or the schedulers.
 *
 * Once the registrar publishes a term, the SIS is the record and the plan for
 * that term is only a reference. So a department's term is read-only the
 * moment any SIS section exists for it, and editable while none does. This
 * replaces the date test the page used to apply: a term that has begun is a
 * term the SIS has published, and two rules that can disagree are worse than
 * one that cannot.
 *
 * The front end reads the flag this one produces in useTermSchedule.ts.
 * This is the enforcement, that is the courtesy.
 */
class TermLock {
    public static function isReadOnly(?int $academicOrg, int $termCode): bool {
        // a group with no department has nothing to plan against
        if ($academicOrg === null) {
            return true;
        }

        return SisClassSection::query()
            ->forDepartmentTerm($academicOrg, $termCode)
            ->exists();
    }

    public static function isEditable(?int $academicOrg, int $termCode): bool {
        return !self::isReadOnly($academicOrg, $termCode);
    }

    /** @return Collection<int, int> term codes */
    public static function readOnlyTermCodesBetween(int $academicOrg, int $startTermCode, int $endTermCode): Collection {
        return SisClassSection::query()
            ->where('academic_org', $academicOrg)
            ->whereBetween('term_code', [$startTermCode, $endTermCode])
            ->distinct()
            ->pluck('term_code');
    }
}
