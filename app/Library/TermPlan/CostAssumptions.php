<?php

namespace App\Library\TermPlan;

use App\JobCode;
use App\JobCodeTermRate;
use App\SisAppointment;
use App\TermJobCodeRateOverride;
use App\TermPersonNote;
use App\TermPersonRateOverride;
use Illuminate\Support\Collection;

final class CostAssumptions {
    public static function forTerm(int $academicOrg, int $termCode): array {
        return [
            'termCode' => $termCode,
            'season' => Season::ofTerm($termCode)->value,
            'jobCodes' => self::jobCodes($termCode),
            'people' => self::people($academicOrg),
            'rateOverrides' => [
                'jobCodes' => self::jobCodeRateOverrides($academicOrg, $termCode),
                'people' => self::personRateOverrides($academicOrg, $termCode),
            ],
            'personNotes' => self::personNotes($academicOrg, $termCode),
        ];
    }

    /**
     * Trimmed, distinct, and sorted.
     *
     * @return array<int, string>
     */
    public static function jobCodesHeldInDepartment(int $academicOrg): array {
        return self::distinctJobCodes(self::appointmentsOf($academicOrg));
    }

    private static function jobCodes(int $termCode): array {
        return JobCode::query()
            ->with(['termRates' => fn($rates) => $rates->where('term_code', $termCode)])
            ->orderBy('code')
            ->get()
            ->map(function (JobCode $jobCode) {
                /** @var JobCodeTermRate|null $termRate */
                $termRate = $jobCode->termRates->first();

                return [
                    'code' => $jobCode->code,
                    'title' => $jobCode->title,
                    'instructorType' => $jobCode->instructor_type?->value,
                    'annualLoad' => $jobCode->annual_load,
                    'salary' => $termRate === null ? null : (float) $termRate->salary,
                    'fringeRate' => $termRate === null ? null : (float) $termRate->fringe_rate,
                    'source' => $termRate?->source,
                ];
            })
            ->all();
    }

    private static function people(int $academicOrg): array {
        return self::appointmentsOf($academicOrg)
            ->groupBy('emplid')
            ->map(fn(Collection $appointments, int $emplid) => [
                'emplid' => $emplid,
                'jobCodes' => self::distinctJobCodes($appointments),
                'positionTitles' => self::positionTitlesByJobCode($appointments),
            ])
            ->values()
            ->all();
    }

    private static function jobCodeRateOverrides(int $academicOrg, int $termCode): array {
        return TermJobCodeRateOverride::query()
            ->where('academic_org', $academicOrg)
            ->where('term_code', $termCode)
            ->orderBy('job_code')
            ->get()
            ->map(fn(TermJobCodeRateOverride $override) => [
                'jobCode' => $override->job_code,
                'salary' => $override->salary,
                'fringeRate' => $override->fringe_rate,
            ])
            ->all();
    }

    private static function personRateOverrides(int $academicOrg, int $termCode): array {
        return TermPersonRateOverride::query()
            ->where('academic_org', $academicOrg)
            ->where('term_code', $termCode)
            ->orderBy('emplid')
            ->get()
            ->map(fn(TermPersonRateOverride $override) => [
                'emplid' => $override->emplid,
                'salary' => $override->salary,
            ])
            ->all();
    }

    private static function personNotes(int $academicOrg, int $termCode): array {
        return TermPersonNote::query()
            ->where('academic_org', $academicOrg)
            ->where('term_code', $termCode)
            ->orderBy('emplid')
            ->get()
            ->map(fn(TermPersonNote $note) => [
                'emplid' => $note->emplid,
                'notes' => $note->notes,
            ])
            ->all();
    }

    /** @return Collection<int, SisAppointment> */
    private static function appointmentsOf(int $academicOrg): Collection {
        return SisAppointment::query()
            ->where('dept_id', (string) $academicOrg)
            ->get(['emplid', 'job_code', 'position_desc']);
    }

    /** @return array<int, string> */
    private static function distinctJobCodes(Collection $appointments): array {
        return $appointments
            ->map(fn(SisAppointment $appointment) => trim($appointment->job_code))
            ->unique()
            ->sort()
            ->values()
            ->all();
    }

    /** @return array<string, string> without job codes that have no position description */
    private static function positionTitlesByJobCode(Collection $appointments): array {
        return $appointments
            ->filter(fn(SisAppointment $appointment) => filled($appointment->position_desc))
            ->mapWithKeys(fn(SisAppointment $appointment) => [
                trim($appointment->job_code) => trim($appointment->position_desc),
            ])
            ->all();
    }
}
