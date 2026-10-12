<?php

use App\Group;
use App\Membership;
use App\Role;
use App\User;
use Database\Seeders\TestDatabaseSeeder;

use function Pest\Laravel\getJson;

beforeEach(function () {
    $this->seed(TestDatabaseSeeder::class);
    $user = User::where('umndid', 'basic_user')->first();
    $token = $user->createToken('test_token', ['*'])->plainTextToken;
    $this->headers = ['Authorization' => 'Bearer ' . $token];
    $this->role = Role::factory()->create();
});

function roleHolderRowsForGroup(array $headers, Role $role, Group $group): array {
    $res = getJson('/api/remote/role-holders?roles[]=' . $role->id, $headers);
    expect($res->status())->toBe(200);

    return collect($res->json())->where('group_id', $group->id)->values()->all();
}

describe("GET /api/remote/role-holders", function () {
    it('returns a 401 with invalid token', function () {
        $res = getJson('/api/remote/role-holders?roles[]=1', [
            'Authorization' => 'Bearer invalid_token'
        ]);

        expect($res->status())->toBe(401);
    });

    it('returns a 422 without roles', function () {
        $res = getJson('/api/remote/role-holders', $this->headers);

        expect($res->status())->toBe(422);
    });

    it('returns a 422 for a repeated role', function () {
        $roleId = $this->role->id;
        $res = getJson("/api/remote/role-holders?roles[]={$roleId}&roles[]={$roleId}", $this->headers);

        expect($res->status())->toBe(422);
    });

    it("returns a department's own role holder", function () {
        $department = Group::factory()->create();
        $membership = Membership::factory()->create([
            'group_id' => $department->id,
            'role_id' => $this->role->id,
        ]);

        $rows = roleHolderRowsForGroup($this->headers, $this->role, $department);

        expect($rows)->toHaveCount(1);
        expect($rows[0])->toMatchArray([
            'group_id' => $department->id,
            'dept_id' => (string) $department->dept_id,
            'role_id' => $this->role->id,
            'role_label' => $this->role->label,
            'holder_group_id' => $department->id,
            'membership_id' => $membership->id,
        ]);
        expect($rows[0]['user']['id'])->toBe($membership->user_id);
    });

    it('falls back to the nearest ancestor with a holder, skipping a parent without one', function () {
        $grandparent = Group::factory()->create(['dept_id' => null]);
        $parent = Group::factory()->create(['dept_id' => null, 'parent_group_id' => $grandparent->id]);
        $department = Group::factory()->create(['parent_group_id' => $parent->id]);
        Membership::factory()->create([
            'group_id' => $grandparent->id,
            'role_id' => $this->role->id,
        ]);

        $rows = roleHolderRowsForGroup($this->headers, $this->role, $department);

        expect($rows)->toHaveCount(1);
        expect($rows[0]['holder_group_id'])->toBe($grandparent->id);
    });

    it('ignores holders in an inactive parent and walks past it', function () {
        $grandparent = Group::factory()->create(['dept_id' => null]);
        $parent = Group::factory()->create(['active_group' => false, 'parent_group_id' => $grandparent->id]);
        $department = Group::factory()->create(['parent_group_id' => $parent->id]);
        Membership::factory()->create([
            'group_id' => $parent->id,
            'role_id' => $this->role->id,
        ]);
        Membership::factory()->create([
            'group_id' => $grandparent->id,
            'role_id' => $this->role->id,
        ]);

        $rows = roleHolderRowsForGroup($this->headers, $this->role, $department);

        expect($rows)->toHaveCount(1);
        expect($rows[0]['holder_group_id'])->toBe($grandparent->id);
    });

    it('ignores holders in a soft-deleted parent and walks past it', function () {
        $grandparent = Group::factory()->create(['dept_id' => null]);
        $parent = Group::factory()->create(['dept_id' => null, 'parent_group_id' => $grandparent->id]);
        $department = Group::factory()->create(['parent_group_id' => $parent->id]);
        Membership::factory()->create([
            'group_id' => $parent->id,
            'role_id' => $this->role->id,
        ]);
        Membership::factory()->create([
            'group_id' => $grandparent->id,
            'role_id' => $this->role->id,
        ]);
        $parent->delete();

        $rows = roleHolderRowsForGroup($this->headers, $this->role, $department);

        expect($rows)->toHaveCount(1);
        expect($rows[0]['holder_group_id'])->toBe($grandparent->id);
    });

    it('ignores ended memberships', function () {
        $parent = Group::factory()->create(['dept_id' => null]);
        $department = Group::factory()->create(['parent_group_id' => $parent->id]);
        Membership::factory()->create([
            'group_id' => $department->id,
            'role_id' => $this->role->id,
            'end_date' => now()->subDay(),
        ]);
        Membership::factory()->create([
            'group_id' => $parent->id,
            'role_id' => $this->role->id,
        ]);

        $rows = roleHolderRowsForGroup($this->headers, $this->role, $department);

        expect($rows)->toHaveCount(1);
        expect($rows[0]['holder_group_id'])->toBe($parent->id);
    });

    it('excludes inactive departments', function () {
        $department = Group::factory()->create(['active_group' => false]);
        Membership::factory()->create([
            'group_id' => $department->id,
            'role_id' => $this->role->id,
        ]);

        expect(roleHolderRowsForGroup($this->headers, $this->role, $department))->toBeEmpty();
    });

    it('excludes groups whose dept_id is not numeric', function () {
        $group = Group::factory()->create(['dept_id' => 'see parent']);
        Membership::factory()->create([
            'group_id' => $group->id,
            'role_id' => $this->role->id,
        ]);

        expect(roleHolderRowsForGroup($this->headers, $this->role, $group))->toBeEmpty();
    });

    it('returns no rows when no ancestor has a holder', function () {
        $parent = Group::factory()->create(['dept_id' => null]);
        $department = Group::factory()->create(['parent_group_id' => $parent->id]);

        expect(roleHolderRowsForGroup($this->headers, $this->role, $department))->toBeEmpty();
    });

    it('stops walking when parent groups form a cycle', function () {
        $department = Group::factory()->create();
        $parent = Group::factory()->create(['parent_group_id' => $department->id]);
        $department->update(['parent_group_id' => $parent->id]);

        expect(roleHolderRowsForGroup($this->headers, $this->role, $department))->toBeEmpty();
    });
});
