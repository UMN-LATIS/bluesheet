<?php

use App\Constants\Permissions;
use App\Membership;
use App\User;
use App\Group;
use Database\Seeders\TestDatabaseSeeder;
use function Pest\Laravel\{postJson, actingAs };

beforeEach(function () {
    setupMockBandaidApiResponses();
    $this->seed(TestDatabaseSeeder::class);

    $this->superAdmin = User::where('umndid', 'admin')->first();

    $this->validGroupData = [
        'groupName' => 'New group',
        'groupType' => 'department',
        'parentOrganization' => null,
    ];
});

it('returns 401 for unauthenticated user', function () {
    postJson('/api/group', $this->validGroupData)
        ->assertStatus(401);
});


it('does not let a default user create a group', function () {
    actingAs(User::factory()->create())
        ->postJson('/api/group', $this->validGroupData)
        ->assertStatus(403);
});

it('creates a group', function (User $user) {
    actingAs($user)
        ->postJson('/api/group', $this->validGroupData)
        ->assertStatus(200); // TODO: 201
})->with([
    'super admin' => fn () => $this->superAdmin,
    'user with edit groups permission' => fn () => User::factory()->create()->givePermissionTo(Permissions::CREATE_GROUPS),
]);

it('handles invalid group data', function () {
    actingAs($this->superAdmin)
        ->postJson('/api/group', [])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['groupName', 'groupType']);
});

describe('as a group manager', function () {
    beforeEach(function () {
        $this->groupManager = User::factory()->create();
        $this->groupMembership =
            Membership::factory()->create([
                'user_id' => $this->groupManager->id,
                'group_id' => Group::factory()->create()->id,
                'admin' => true,
            ]);
        $this->group = $this->groupMembership->group;
    });

    it('lets a group manager create a subgroup of a managed group', function () {
        actingAs($this->groupManager)
            ->postJson('/api/group', [
                ...$this->validGroupData,
                'parentGroupId' => $this->group->id,
            ])
            ->assertStatus(200);
    });

    it('checks that the parentGroupId is valid', function () {
        actingAs($this->groupManager)
            ->postJson('/api/group', [
                ...$this->validGroupData,
                'parentGroupId' => 999999,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['parentGroupId']);
    });

    it('does not let a group manager create a subgroup of a group they do not manage', function () {
        actingAs($this->groupManager)
            ->postJson('/api/group', [
                ...$this->validGroupData,
                'parentGroupId' => Group::factory()->create()->id,
            ])
            ->assertStatus(403);
    });
});
