<?php

namespace App\Library\LeavePlanning;

use App\SisAppointment;
use App\SisEmployee;
use App\User;
use Illuminate\Support\Collection;

class PlanningPeople {
    private const UNSPECIFIED_CATEGORY = 'Unspecified';

    /**
     * @param Collection<int, int> $emplids duplicates allowed
     * @return Collection<int, array> by last name, then first
     */
    public static function inDepartment(string $deptId, Collection $emplids): Collection {
        $emplids = $emplids->map(fn($emplid) => (int) $emplid)->unique()->values();

        $employees = SisEmployee::whereIn('emplid', $emplids)->get()->keyBy('emplid');

        $appointments = SisAppointment::query()
            ->where('dept_id', $deptId)
            ->whereIn('emplid', $emplids)
            ->get()
            ->groupBy('emplid');

        $users = User::whereIn('emplid', $emplids)
            ->orderBy('id')
            ->get()
            ->unique('emplid')
            ->keyBy('emplid');

        return $emplids
            ->map(fn(int $emplid) => self::describe(
                $emplid,
                $employees->get($emplid),
                $appointments->get($emplid, collect()),
                $users->get($emplid),
            ))
            ->sortBy(fn(array $person) => [
                mb_strtolower($person['lastName']),
                mb_strtolower($person['firstName']),
                $person['emplid'],
            ])
            ->values();
    }

    private static function describe(int $emplid, ?SisEmployee $employee, Collection $appointments, ?User $user): array {
        return [
            'emplid' => $emplid,
            'userId' => $user?->id,
            'name' => $employee?->full_name ?? $user?->displayName ?? '',
            'firstName' => $employee?->first_name ?? $user?->givenname ?? '',
            'lastName' => $employee?->last_name ?? $user?->surname ?? '',
            'title' => self::titleOf($appointments),
            'categories' => $appointments
                ->map(fn(SisAppointment $appointment) => trim((string) $appointment->category) ?: self::UNSPECIFIED_CATEGORY)
                ->unique()
                ->sort()
                ->values(),
            'jobCodes' => $appointments
                ->map(fn(SisAppointment $appointment) => trim((string) $appointment->job_code))
                ->filter()
                ->unique()
                ->sort()
                ->values(),
            'hasAppointment' => $appointments->isNotEmpty(),
            'eligibility' => [
                'ssl' => (bool) $user?->ssl_eligible,
                'sslApply' => (bool) $user?->ssl_apply_eligible,
                'midcareer' => (bool) $user?->midcareer_eligible,
            ],
        ];
    }

    private static function titleOf(Collection $appointments): ?string {
        return $appointments
            ->sortBy(fn(SisAppointment $appointment) => $appointment->job_indicator === 'P' ? 0 : 1)
            ->map(fn(SisAppointment $appointment) => trim((string) $appointment->position_desc))
            ->first(fn(string $title) => $title !== '');
    }
}
