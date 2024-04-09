<?php

use App\{User, Leave, Group, Membership};
use App\Constants\Permissions;
use Database\Seeders\TestDatabaseSeeder;
use function Pest\Laravel\{postJson, getJson, actingAs, deleteJson};

beforeEach(function () {
    setupMockBandaidApiResponses();
    $this->seed(TestDatabaseSeeder::class);

    $this->group = Group::factory()->create();
    $this->membership = Membership::factory()->create([
        'group_id' => $this->group->id,
    ]);

    $this->superAdmin = User::where('umndid', 'admin')->first();
    $this->groupManager = User::factory()->create();
    $this->groupMembership = Membership::factory()->create([
        'user_id' => $this->groupManager->id,
        'group_id' => $this->group->id,
        'admin' => true,
    ]);
});

describe("/api/permissions/groups/{groupId}/subgroups", function () {
    it('requires authentication', function () {
        getJson("/api/permissions/groups/{$this->group->id}/subgroups")
            ->assertUnauthorized();
    });

    it('shows a default user can view subgroups but not create', function () {
        actingAs(User::factory()->create())
            ->getJson("/api/permissions/groups/{$this->group->id}/subgroups")
            ->assertOk()
            ->assertJson([
                'viewAny' => true,
                'create' => false,
            ]);
    });

    it('permits users with proper permissions to create subgroups', function (User $user) {
        actingAs($user)
            ->getJson("/api/permissions/groups/{$this->group->id}/subgroups")
            ->assertOk()
            ->assertJson([
                'viewAny' => true,
                'create' => true,
            ]);
    })->with([
        'super admin' => fn () => $this->superAdmin,
        'user with create groups permissions' => fn () => User::factory()->create()->givePermissionTo(Permissions::CREATE_GROUPS),
        'group manager' => fn () => $this->groupManager,
    ]);
});
