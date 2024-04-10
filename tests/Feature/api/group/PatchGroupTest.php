<?php

use App\Constants\Permissions;
use App\Membership;
use App\User;
use App\Group;
use Database\Seeders\TestDatabaseSeeder;
use function Pest\Laravel\{patchJson, actingAs};

function createGroupAndLoadRelationships($attrs = null) {
    $group = Group::factory()
        ->create($attrs)
        ->load([
            'artifacts',
            'groupType',
            'members',
            'members.role'
        ]);

    return $group;
}

beforeEach(function () {
    setupMockBandaidApiResponses();
    $this->seed(TestDatabaseSeeder::class);

    $this->superAdmin = User::where('umndid', 'admin')->first();

    $this->group = createGroupAndLoadRelationships();

    $this->groupManager = User::factory()->create();
    $this->groupMembership =
        Membership::factory()->create([
            'user_id' => $this->groupManager->id,
            'group_id' => $this->group->id,
            'admin' => true,
        ]);
});

describe('PUT /api/group/{groupId}', function () {
    it('rejects unauthenticated user', function () {
        patchJson("/api/group/{$this->group->id}", [
            'group_title' => 'New group name',
        ])
            ->assertStatus(401);
    });

    it('does not let a default user update a group', function () {
        actingAs(User::factory()->create())
            ->patchJson("/api/group/{$this->group->id}", [
                'group_title' => 'New group name',
            ])
            ->assertStatus(403);
    });

    it('updates a group', function (User $user) {
        actingAs($user)
            ->patchJson("/api/group/{$this->group->id}", [
                ...$this->group->toArray(),
                'group_title' => 'New group name',
            ])
            ->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertDatabaseHas('groups', [
            'id' => $this->group->id,
            'group_title' => 'New group name',
        ]);

    })->with([
        'super admin' => fn () => $this->superAdmin,
        'user with edit groups permission' => fn () => User::factory()->create()->givePermissionTo(Permissions::EDIT_GROUPS),
        'group manager' => fn () => $this->groupManager,
    ]);

    it('updates a subgroup', function (User $user) {
        $subgroup = createGroupAndLoadRelationships([
            'parent_group_id' => $this->group->id,
        ]);

        actingAs($user)
            ->patchJson("/api/group/{$subgroup->id}", [
                ...$subgroup->toArray(),
                'group_title' => 'New subgroup name',
            ])
            ->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertDatabaseHas('groups', [
            'id' => $subgroup->id,
            'group_title' => 'New subgroup name',
        ]);

    })->with([
        'super admin' => fn () => $this->superAdmin,
        'user with edit groups permission' => fn () => User::factory()->create()->givePermissionTo(Permissions::EDIT_GROUPS),
        // 'group manager' => fn () => $this->groupManager,
    ]);

});
