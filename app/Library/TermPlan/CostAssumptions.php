<?php

namespace App\Library\TermPlan;

use App\GradAppointmentLevel;
use App\GradTermRate;
use App\JobCode;
use App\JobCodeTermRate;
use App\SisAppointment;
use App\TermGradPerson;
use App\TermPersonInput;
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
                'people' => self::personRateOverrides($academicOrg, $termCode),
            ],
            'gradRates' => self::gradRates($termCode),
            'gradPeople' => self::gradPeople($academicOrg, $termCode),
            'personInputs' => self::personInputs($academicOrg, $termCode),
        ];
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
                    'studentStatus' => $jobCode->student_status?->value,
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

    private static function gradRates(int $termCode): array {
        $gradRate = GradTermRate::query()->with('levels')->where('term_code', $termCode)->first();

        return [
            'defaultAppointmentPercent' => $gradRate === null ? null : (float) $gradRate->default_appointment_percent,
            'defaults' => $gradRate === null ? null : GradRateInputs::fromRow($gradRate),
            'levels' => $gradRate === null ? [] : $gradRate->levels
                ->map(fn(GradAppointmentLevel $level) => [
                    'appointmentPercent' => $level->appointment_percent,
                    'hours' => $level->hours,
                ])
                ->all(),
        ];
    }

    private static function gradPeople(int $academicOrg, int $termCode): array {
        return TermGradPerson::query()
            ->where('academic_org', $academicOrg)
            ->where('term_code', $termCode)
            ->orderBy('emplid')
            ->get()
            ->map(fn(TermGradPerson $person) => [
                'emplid' => $person->emplid,
                'hasFeeOffset' => $person->has_fee_offset,
                'isInternational' => $person->is_international,
            ])
            ->all();
    }

    private static function personInputs(int $academicOrg, int $termCode): array {
        return TermPersonInput::query()
            ->where('academic_org', $academicOrg)
            ->where('term_code', $termCode)
            ->orderBy('emplid')
            ->get()
            ->map(fn(TermPersonInput $input) => [
                'emplid' => $input->emplid,
                'notes' => $input->notes,
                'yearStarted' => $input->year_started,
                'courseReleases' => $input->course_releases,
                'releaseSource' => $input->release_source,
                'expectedSections' => $input->expected_sections,
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
