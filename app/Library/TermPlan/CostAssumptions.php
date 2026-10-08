<?php

namespace App\Library\TermPlan;

use App\JobCode;
use App\JobCodeRate;
use App\SisAppointment;
use App\TaAppointmentRate;
use App\TermCostPersonChoice;
use App\TermCostSetting;
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
            'settings' => self::settings($academicOrg, $fiscalYear),
            'people' => self::people($academicOrg),
            'personChoices' => self::personChoices($academicOrg, $termCode),
        ];
    }

    public static function setting(int $academicOrg, int $fiscalYear, CostSettingDefinition $definition): array {
        $departmentValue = self::departmentValuesByKey($academicOrg, $fiscalYear)->get($definition->key);

        return self::describeSetting($definition, $departmentValue);
    }

    /** @return array<int, string> */
    public static function jobCodesHeldBy(int $academicOrg, int $emplid): array {
        $appointments = self::appointmentsByEmplid($academicOrg, $emplid)->get($emplid, collect());

        return self::distinctJobCodes($appointments);
    }

    public static function describePersonChoice(TermCostPersonChoice $choice): array {
        return [
            'emplid' => $choice->emplid,
            'jobCode' => $choice->job_code,
            'instructorType' => $choice->instructor_type?->value,
            'studentStatus' => $choice->student_status?->value,
            'overrideCost' => $choice->override_cost,
            'overrideReason' => $choice->override_reason,
        ];
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
                    'instructorType' => $jobCode->instructor_type->value,
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

    private static function settings(int $academicOrg, int $fiscalYear): array {
        $departmentValuesByKey = self::departmentValuesByKey($academicOrg, $fiscalYear);

        return collect(CostSettings::all())
            ->map(fn(CostSettingDefinition $definition) => self::describeSetting(
                $definition,
                $departmentValuesByKey->get($definition->key),
            ))
            ->values()
            ->all();
    }

    /** @return Collection<string, TermCostSetting> the latest at or before `$fiscalYear` */
    private static function departmentValuesByKey(int $academicOrg, int $fiscalYear): Collection {
        return TermCostSetting::query()
            ->where('academic_org', $academicOrg)
            ->where('fiscal_year', '<=', $fiscalYear)
            ->orderByDesc('fiscal_year')
            ->get()
            ->unique('key')
            ->keyBy('key');
    }

    private static function describeSetting(CostSettingDefinition $definition, ?TermCostSetting $departmentValue): array {
        return [
            'key' => $definition->key,
            'label' => $definition->label,
            'description' => $definition->description,
            'type' => $definition->type->value,
            'default' => $definition->default,
            'value' => $departmentValue === null
                ? $definition->default
                : $definition->type->fromStored($departmentValue->value),
            'valueFiscalYear' => $departmentValue?->fiscal_year,
        ];
    }

    private static function people(int $academicOrg): array {
        return self::appointmentsByEmplid($academicOrg)
            ->map(fn(Collection $appointments, int $emplid) => [
                'emplid' => $emplid,
                'jobCodes' => self::distinctJobCodes($appointments),
                'positionTitles' => self::positionTitlesByJobCode($appointments),
            ])
            ->values()
            ->all();
    }

    private static function personChoices(int $academicOrg, int $termCode): array {
        return TermCostPersonChoice::query()
            ->where('academic_org', $academicOrg)
            ->where('term_code', $termCode)
            ->orderBy('emplid')
            ->get()
            ->map(self::describePersonChoice(...))
            ->all();
    }

    /** @return Collection<int, Collection<int, SisAppointment>> */
    private static function appointmentsByEmplid(int $academicOrg, ?int $emplid = null): Collection {
        return SisAppointment::query()
            ->where('dept_id', (string) $academicOrg)
            ->when($emplid !== null, fn($appointments) => $appointments->where('emplid', $emplid))
            ->get(['emplid', 'job_code', 'position_desc'])
            ->groupBy('emplid');
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
