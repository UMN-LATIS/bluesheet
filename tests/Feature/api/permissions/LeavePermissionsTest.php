<?php

use App\{User, Leave, Group, Membership};
use App\Constants\Permissions;
use Database\Seeders\TestDatabaseSeeder;
use function Pest\Laravel\{postJson, getJson, actingAs, deleteJson};

beforeEach(function () {
    setupMockBandaidApiResponses();
    $this->seed(TestDatabaseSeeder::class);

    $this->leaveOwner = User::factory()->create();
    $this->leave = Leave::factory()->create([
        'user_id' => $this->leaveOwner->id,
    ]);
    $this->group = Group::factory()->create();
    $this->membership = Membership::factory()->create([
        'user_id' => $this->leaveOwner->id,
        'group_id' => $this->group->id,
    ]);
});

describe('GET /api/permissions/leaves/{leaveId}', function () {
    it('returns 401 for unauthenticated user for show', function () {
        getJson("/api/permissions/leaves/{$this->leave->id}")
            ->assertUnauthorized();
    });

    it('gets correct leave permissions for user without permission', function () {
        actingAs(User::factory()->create())
            ->getJson("/api/permissions/leaves/{$this->leave->id}")
            ->assertOk()
            ->assertJson([
                'view' => false,
                'update' => false,
                'delete' => false,
            ]);
    });

    it('gets correct leave permissions for user with permission', function () {
        $managerMembership = Membership::factory()->create([
            'group_id' => $this->group->id,
            'admin' => true,
        ]);
        $manager = $managerMembership->user;


        actingAs($manager)
            ->getJson("/api/permissions/leaves/{$this->leave->id}")
            ->assertOk()
            ->assertJson([
                'view' => true,
                'update' => true,
                'delete' => true,
            ]);
    });
});


describe('GET /api/permissions/users/{leaveOwner}/leaves', function () {

    it('returns 401 for unauthed users accessing ', function () {
        getJson("/api/permissions/users/{$this->leaveOwner->id}/leaves")
            ->assertUnauthorized();
    });

    it('returns user leave permissions for authed user without permissions', function () {
        actingAs(User::factory()->create())
            ->getJson("/api/permissions/users/{$this->leaveOwner->id}/leaves")
            ->assertOk()
            ->assertJson([
                'viewAny' => false,
                'create' => false,
            ]);
    });

    it('gets correct permissions for user with permissions', function () {
        actingAs($this->leaveOwner)
            ->getJson("/api/permissions/users/{$this->leaveOwner->id}/leaves")
            ->assertOk()
            ->assertJson([
                'viewAny' => true,
                'create' => false,
            ]);

        $this->leaveOwner->givePermissionTo(Permissions::EDIT_ANY_LEAVES);

        actingAs($this->leaveOwner)
            ->getJson("/api/permissions/users/{$this->leaveOwner->id}/leaves")
            ->assertOk()
            ->assertJson([
                'viewAny' => true,
                'create' => true,
            ]);
    });
});

describe('GET /api/permissions/groups/{groupId}/leaves', function () {
    it('returns 401 for unauthed users accessing ', function () {
        getJson("/api/permissions/groups/{$this->group->id}/groups")
            ->assertUnauthorized();
    });

    it('returns group leave permissions for authed user without permissions', function () {
        actingAs(User::factory()->create())
            ->getJson("/api/permissions/groups/{$this->group->id}/leaves")
            ->assertOk()
            ->assertJson([
                'viewAny' => false,
                'create' => false,
            ]);
    });

    it('gets correct permissions for user with permissions', function () {
        // add a manager to the group
        $managerMembership = Membership::factory()->create([
            'group_id' => $this->group->id,
            'admin' => true,
        ]);
        $manager = $managerMembership->user;

        actingAs($manager)
            ->getJson("/api/permissions/groups/{$this->group->id}/leaves")
            ->assertOk()
            ->assertJson([
                'viewAny' => true,
                'create' => true,
            ]);
    });
});
