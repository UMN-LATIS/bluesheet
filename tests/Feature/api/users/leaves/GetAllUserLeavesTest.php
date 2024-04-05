<?php

use App\Constants\Permissions;
use App\Leave;
use App\Membership;
use App\User;
use Database\Seeders\TestDatabaseSeeder;
use function Pest\Laravel\{postJson, getJson, actingAs, deleteJson};

beforeEach(function () {
    setupMockBandaidApiResponses();
    $this->seed(TestDatabaseSeeder::class);

    // Create a leave entry
    $this->leaveOwner = User::factory()->create();
    $this->leaves = Leave::factory()->count(3)->create(
        ['user_id' => $this->leaveOwner->id]
    );

    // super admin
    $this->superAdmin = User::where('umndid', 'admin')->first();

    // user with VIEW_ANY_LEAVES permission
    $this->viewAnyLeavesUser = User::factory()->create();
    $this->viewAnyLeavesUser->givePermissionTo(Permissions::VIEW_ANY_LEAVES);
});

it('lets a user view all of their leaves', function () {
    actingAs($this->leaveOwner)
        ->getJson("/api/users/{$this->leaveOwner->id}/leaves")
        ->assertOk()
        ->assertJsonCount(3)
        ->assertJsonStructure([
            '*' => [
                "id",
                "user",
                "user_id",
                "description",
                "start_date",
                "end_date",
                "type",
                "status",
                "canCurrentUser",
            ],
        ]);
});

it('lets a user with VIEW_ANY_LEAVES permission view all leaves for another user ', function () {
    actingAs($this->viewAnyLeavesUser)
        ->getJson("/api/users/{$this->leaveOwner->id}/leaves")
        ->assertOk()
        ->assertJsonCount(3)
        ->assertJsonStructure([
            '*' => [
                "id",
                "user",
                "user_id",
                "description",
                "start_date",
                "end_date",
                "type",
                "status",
                "canCurrentUser",
            ],
        ]);
});

it('does not permit users to view leaves for other users', function () {
    actingAs(User::factory()->create())
        ->getJson("/api/users/{$this->leaveOwner->id}/leaves")
        ->assertForbidden();
});


it('does not allow unauthenticated users to view leaves', function () {
    getJson("/api/users/{$this->leaveOwner->id}/leaves")
        ->assertUnauthorized();
});

it('does not allow a user to view leaves for a user that does not exist', function () {
    actingAs($this->viewAnyLeavesUser)
        ->getJson("/api/users/999999/leaves")
        ->assertNotFound();
});


describe('as a fellow group member', function () {
    beforeEach(function () {
        // create a membership for the leave owner
        // which will also create the group for our test
        $leaveUserMembership = Membership::factory()->create([
            'user_id' => $this->leaveOwner->id,
        ]);

        // then create another membership within the group
        // which we can promote (or not) to a BlueSheet Manager
        $this->fellowGroupMembership = Membership::factory()->create([
            'group_id' => $leaveUserMembership->group_id,
        ]);
    });

    it('lets a BlueSheet manager get any member\'s leaves', function () {
        promoteUserToGroupManager($this->fellowGroupMembership->user->id, $this->fellowGroupMembership->group->id);

        actingAs($this->fellowGroupMembership->user)
            ->getJson("/api/users/{$this->leaveOwner->id}/leaves")
            ->assertOk();
    });

    it('does not allow a group member to view another user\'s leaves', function () {
        actingAs($this->fellowGroupMembership->user)
            ->getJson("/api/users/{$this->leaveOwner->id}/leaves")
            ->assertForbidden();
    });
});
