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
    $this->leave = Leave::factory()->create();

    // super admin
    $this->superAdmin = User::where('umndid', 'admin')->first();
});

it('returns a 401 for unauthenticated user', function () {
    deleteJson("/api/leaves/{$this->leave->id}")
        ->assertStatus(401);
});

it('lets a super admin delete a leave', function () {
    actingAs($this->superAdmin)
        ->deleteJson("/api/leaves/{$this->leave->id}")
        ->assertStatus(204);
});

it('returns a 403 for a user without permission', function () {
    actingAs(User::factory()->create())
        ->deleteJson("/api/leaves/{$this->leave->id}")
        ->assertStatus(403);
});

it('lets a user with `edit any leaves` permission delete a leave', function () {
    $user = User::factory()->create();
    $user->givePermissionTo(Permissions::EDIT_ANY_LEAVES);

    actingAs($user)
        ->deleteJson("/api/leaves/{$this->leave->id}")
        ->assertStatus(204);
});

it('does not let a user delete their own leave', function () {
    actingAs($this->leave->user)
        ->deleteJson("/api/leaves/{$this->leave->id}")
        ->assertStatus(403);
});

describe('as a fellow group member', function () {

    beforeEach(function () {
        // create a membership for the leave owner
        // which will also create the group for our test
        $leaveUserMembership = Membership::factory()->create([
            'user_id' => $this->leave->user->id,
        ]);

        // then create another membership within the group
        // which we can promote (or not) to a BlueSheet Manager
        $this->fellowGroupMembership = Membership::factory()->create([
            'group_id' => $leaveUserMembership->group_id,
        ]);
    });

    it('lets a group manager delete any member leave', function () {
        // promote the fellow group member to a group manager
        promoteUserToGroupManager($this->fellowGroupMembership->user_id, $this->fellowGroupMembership->group_id);

        actingAs($this->fellowGroupMembership->user)
            ->deleteJson("/api/leaves/{$this->leave->id}")
            ->assertStatus(204);
    });

    it('does not permit a non-managing member to delete leaves of other members', function () {
        actingAs($this->fellowGroupMembership->user)
            ->deleteJson("/api/leaves/{$this->leave->id}")
            ->assertStatus(403);
    });

    it('doees not permit a group manager to delete leaves of other groups', function () {
        promoteUserToGroupManager($this->fellowGroupMembership->user_id, $this->fellowGroupMembership->group_id);

        // create a new leave not owned by a member of the group
        $leave = Leave::factory()->create();

        actingAs($this->fellowGroupMembership->user)
            ->deleteJson("/api/leaves/{$leave->id}")
            ->assertStatus(403);
    });
});
