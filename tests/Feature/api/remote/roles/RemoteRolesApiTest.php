<?php

use App\Group;
use App\GroupType;
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
});

function remoteRole(array $headers, Role $role): array {
    $res = getJson('/api/remote/roles', $headers);
    expect($res->status())->toBe(200);

    return collect($res->json())->firstWhere('id', $role->id);
}

describe("GET /api/remote/roles", function () {
    it('returns a 401 with invalid token', function () {
        $res = getJson('/api/remote/roles', [
            'Authorization' => 'Bearer invalid_token'
        ]);

        expect($res->status())->toBe(401);
    });

    it('returns an unofficial role with its label', function () {
        $role = Role::factory()->create();

        expect(remoteRole($this->headers, $role))->toBe([
            'id' => $role->id,
            'label' => $role->label,
            'is_official' => false,
            'current_holder_count' => 0,
        ]);
    });

    it('marks a role official when a group type lists it', function () {
        $role = Role::factory()->create();
        $role->officialGroupType()->attach(GroupType::factory()->create());

        expect(remoteRole($this->headers, $role)['is_official'])->toBeTrue();
    });

    it('counts only the memberships role-holders would return', function () {
        $role = Role::factory()->create();
        $activeGroup = Group::factory()->create();
        $inactiveGroup = Group::factory()->create(['active_group' => false]);
        Membership::factory()->create(['group_id' => $activeGroup->id, 'role_id' => $role->id]);
        Membership::factory()->create(['group_id' => $activeGroup->id, 'role_id' => $role->id, 'end_date' => '2000-01-01']);
        Membership::factory()->create(['group_id' => $inactiveGroup->id, 'role_id' => $role->id]);
        Membership::factory()->create(['group_id' => $activeGroup->id, 'role_id' => $role->id])->user->delete();

        expect(remoteRole($this->headers, $role)['current_holder_count'])->toBe(1);
    });
});
