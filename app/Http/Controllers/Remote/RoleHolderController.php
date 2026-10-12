<?php

namespace App\Http\Controllers\Remote;

use App\Group;
use App\Http\Controllers\Controller;
use App\Membership;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class RoleHolderController extends Controller {
    /**
     * @return list<array{group_id: int, group_title: string, dept_id: string, role_id: int, role_label: string, holder_group_id: int, membership_id: int, user: array{id: int, umndid: ?string, emplid: ?int, displayName: ?string, email: ?string}}>
     */
    public function index(Request $request): array {
        $validated = $request->validate([
            'roles' => 'required|array|max:100',
            'roles.*' => 'distinct|integer|exists:roles,id',
        ]);
        $roleIds = array_map('intval', $validated['roles']);

        $groupsIncludingDeletedById = Group::withTrashed()
            ->get(['id', 'group_title', 'dept_id', 'parent_group_id', 'active_group', 'deleted_at'])
            ->keyBy('id');
        $departments = $groupsIncludingDeletedById->filter(self::isActiveDepartment(...));
        $currentMembershipsByGroupAndRole = self::currentMembershipsInActiveGroups($roleIds)
            ->groupBy(['group_id', 'role_id']);

        $rows = [];
        foreach ($departments as $department) {
            foreach ($roleIds as $roleId) {
                $holderGroupId = self::nearestGroupWithHolder($department->id, $roleId, $groupsIncludingDeletedById, $currentMembershipsByGroupAndRole);
                if ($holderGroupId === null) {
                    continue;
                }
                $holderMemberships = $currentMembershipsByGroupAndRole[$holderGroupId][$roleId];
                foreach ($holderMemberships as $membership) {
                    $rows[] = self::roleHolderRow($department, $holderGroupId, $membership);
                }
            }
        }

        return $rows;
    }

    private static function isActiveDepartment(Group $group): bool {
        return !$group->trashed() && $group->active_group && $group->sis_dept_id !== null;
    }

    /**
     * @param list<int> $roleIds
     * @return Collection<int, Membership>
     */
    private static function currentMembershipsInActiveGroups(array $roleIds): Collection {
        return Membership::with('user', 'role')
            ->whereIn('role_id', $roleIds)
            ->whereHas('group', fn($query) => $query->where('active_group', true))
            // Without this, a soft-deleted user's membership
            // arrives with a null `user`, and roleHolderRow
            // throws calling ->only().
            ->whereHas('user')
            ->where(fn($query) => $query->whereNull('end_date')->orWhere('end_date', '>', date('Y-m-d')))
            ->get();
    }

    private static function roleHolderRow(Group $department, int $holderGroupId, Membership $membership): array {
        return [
            'group_id' => $department->id,
            'group_title' => $department->group_title,
            'dept_id' => $department->sis_dept_id,
            'role_id' => $membership->role_id,
            'role_label' => $membership->role->label,
            'holder_group_id' => $holderGroupId,
            'membership_id' => $membership->id,
            'user' => $membership->user->only(['id', 'umndid', 'emplid', 'displayName', 'email']),
        ];
    }

    private static function nearestGroupWithHolder(int $groupId, int $roleId, Collection $groupsById, Collection $membershipsByGroupAndRole): ?int {
        $visitedGroupIds = [];
        $currentId = $groupId;
        while ($currentId !== null && !isset($visitedGroupIds[$currentId])) {
            if (isset($membershipsByGroupAndRole[$currentId][$roleId])) {
                return $currentId;
            }
            $visitedGroupIds[$currentId] = true;
            $currentId = $groupsById->get($currentId)?->parent_group_id;
        }
        return null;
    }
}
