<?php

namespace App\Library\LeavePlanning;

use App\SisAppointment;
use App\SisEmployee;
use App\User;
use Illuminate\Support\Collection;

class PlanningPeople {
    private const UNSPECIFIED_CATEGORY = 'Unspecified';

    /**
     * One row per distinct emplid, including people with no
     * appointment in the department.
     *
     * @param Collection<int, int> $emplids
     *   duplicates allowed
     * @return Collection<int, array>
     *   sorted by last name, then first
     */
    public static function forEmplids(string $deptId, Collection $emplids): Collection {
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
                ->map(fn(SisAppointment $appointment) => self::categoryOf($appointment))
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
            'sslEligible' => (bool) $user?->ssl_eligible,
            'sslApplyEligible' => (bool) $user?->ssl_apply_eligible,
            'midcareerEligible' => (bool) $user?->midcareer_eligible,
        ];
    }

    private static function titleOf(Collection $appointments): ?string {
        $isPrimary = fn(SisAppointment $appointment) => $appointment->job_indicator === 'P';

        return $appointments
            ->sortByDesc($isPrimary)
            ->map(fn(SisAppointment $appointment) => trim((string) $appointment->position_desc))
            ->first(fn(string $title) => $title !== '');
    }

    private static function categoryOf(SisAppointment $appointment): string {
        $category = trim((string) $appointment->category);

        if ($category === '') {
            return self::UNSPECIFIED_CATEGORY;
        }

        return $category;
    }
}
