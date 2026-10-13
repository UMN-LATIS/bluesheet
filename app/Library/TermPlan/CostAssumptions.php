<?php

namespace App\Library\TermPlan;

use App\JobCode;
use App\JobCodeRate;
use App\SisAppointment;
use App\TaAppointmentRate;
use App\TermCostLineOverride;
use App\TermJobCodeRateOverride;
use App\TermTaRateOverride;
use Illuminate\Support\Collection;

final class CostAssumptions {
    public static function forTerm(int $academicOrg, int $termCode): array {
        $fiscalYear = FiscalYear::ofTerm($termCode);

        return [
            'termCode' => $termCode,
            'fiscalYear' => $fiscalYear,
            'season' => Season::ofTerm($termCode)->value,
            'jobCodes' => self::jobCodes($fiscalYear),
            'taRates' => self::taRatesOfLatestYearEntered($fiscalYear),
            'people' => self::people($academicOrg),
            'rateOverrides' => [
                'jobCodes' => self::jobCodeRateOverrides($academicOrg, $termCode),
                'taAppointments' => self::taRateOverrides($academicOrg, $termCode),
            ],
            'lineOverrides' => self::lineOverrides($academicOrg, $termCode),
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

    private static function jobCodes(int $fiscalYear): array {
        return JobCode::query()
            ->with(['rates' => fn($rates) => $rates
                ->where('fiscal_year', '<=', $fiscalYear)
                ->orderByDesc('fiscal_year')])
            ->orderBy('code')
            ->get()
            ->map(function (JobCode $jobCode) {
                /** @var JobCodeRate|null $latestRate */
                $latestRate = $jobCode->rates->first();

                return [
                    'code' => $jobCode->code,
                    'title' => $jobCode->title,
                    'instructorType' => $jobCode->instructor_type?->value,
                    'annualLoad' => $jobCode->annual_load,
                    'studentStatus' => $jobCode->student_status?->value,
                    'costPerCourse' => $latestRate === null ? null : (float) $latestRate->cost_per_course,
                    'rateFiscalYear' => $latestRate?->fiscal_year,
                    'source' => $latestRate?->source,
                ];
            })
            ->all();
    }

    private static function taRatesOfLatestYearEntered(int $fiscalYear): array {
        $latestYear = TaAppointmentRate::query()
            ->where('fiscal_year', '<=', $fiscalYear)
            ->max('fiscal_year');

        if ($latestYear === null) {
            return ['fiscalYear' => null, 'rates' => []];
        }

        $rates = TaAppointmentRate::query()
            ->where('fiscal_year', $latestYear)
            ->orderBy('season')
            ->orderBy('student_status')
            ->orderBy('appointment_percent')
            ->get();

        return [
            'fiscalYear' => $latestYear,
            'rates' => $rates->map(fn(TaAppointmentRate $rate) => [
                'season' => $rate->season->value,
                'studentStatus' => $rate->student_status->value,
                'appointmentPercent' => $rate->appointment_percent,
                'costPerTerm' => (float) $rate->cost_per_term,
                'source' => $rate->source,
            ])->all(),
        ];
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
                'costPerCourse' => $override->cost_per_course,
            ])
            ->all();
    }

    private static function taRateOverrides(int $academicOrg, int $termCode): array {
        return TermTaRateOverride::query()
            ->where('academic_org', $academicOrg)
            ->where('term_code', $termCode)
            ->orderBy('appointment_percent')
            ->orderBy('student_status')
            ->get()
            ->map(fn(TermTaRateOverride $override) => [
                'appointmentPercent' => $override->appointment_percent,
                'studentStatus' => $override->student_status->value,
                'costPerTerm' => $override->cost_per_term,
            ])
            ->all();
    }

    private static function lineOverrides(int $academicOrg, int $termCode): array {
        return TermCostLineOverride::query()
            ->where('academic_org', $academicOrg)
            ->where('term_code', $termCode)
            ->orderBy('course_code')
            ->orderBy('class_section')
            ->orderBy('emplid')
            ->get()
            ->map(fn(TermCostLineOverride $override) => [
                'courseCode' => $override->course_code,
                'section' => $override->class_section,
                'emplid' => $override->emplid,
                'amount' => $override->amount,
                'reason' => $override->reason,
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
