<?php

use App\Constants\Permissions;
use App\Group;
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
    $this->basicUser = User::where('umndid', 'basic_user')->first();
});

it('returns 401 for unauthenticated user', function () {
    getJson("/api/leaves/{$this->leave->id}")
        ->assertUnauthorized();
});

it('does not allow a user to view another user\'s leave', function () {
    actingAs($this->basicUser)
        ->getJson("/api/leaves/{$this->leave->id}")
        ->assertForbidden();
});

it('allows a user to view their own leave', function () {
    actingAs($this->leave->user)
        ->getJson("/api/leaves/{$this->leave->id}")
        ->assertOk()
        ->assertJsonStructure([
            "id",
            "user_id",
            "description",
            "start_date",
            "end_date",
            "type",
            "status",
            "user",
            "artifacts",
            "canCurrentUser" => [
                "update",
                "delete",
            ]
        ]);
});

it('permits an adming to get a leave', function () {
    actingAs($this->superAdmin)
        ->getJson("/api/leaves/{$this->leave->id}")
        ->assertOk();
});

it('404s for a leave that does not exist', function () {
    actingAs($this->leave->user)
        ->getJson("/api/leaves/999999")
        ->assertNotFound();
});


it('lets a user with `VIEW_ANY_LEAVES` permission view any leave', function () {
    $this->basicUser->givePermissionTo(Permissions::VIEW_ANY_LEAVES);

    actingAs($this->basicUser)
        ->getJson("/api/leaves/{$this->leave->id}")
        ->assertOk();
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

    it('lets a group manager get a group member leave', function () {
        promoteUserToGroupManager($this->fellowGroupMembership->user_id, $this->fellowGroupMembership->group_id);

        actingAs($this->fellowGroupMembership->user)
            ->getJson("/api/leaves/{$this->leave->id}")
            ->assertOk();
    });

    it('does not permit non-managing members to view leaves of other members', function () {
        actingAs($this->fellowGroupMembership->user)
            ->getJson("/api/leaves/{$this->leave->id}")
            ->assertForbidden();
    });

    it('does not permit a group manager to get leaves of other groups', function () {
        promoteUserToGroupManager($this->fellowGroupMembership->user_id, $this->fellowGroupMembership->group_id);

        // create a leave not owned by the group
        $leave = Leave::factory()->create();

        actingAs($this->fellowGroupMembership->user)
            ->getJson("/api/leaves/{$leave->id}")
            ->assertForbidden();
    });
});

describe('as a group manager', function () {
    beforeEach(function () {
        $this->groupManager = User::factory()->create();
        $this->groupMembership = Membership::factory()->create([
            'user_id' => $this->groupManager->id,
        ]);
        $this->managedGroup = $this->groupMembership->group;

        promoteUserToGroupManager($this->groupManager->id, $this->groupMembership->group_id);
    });

    it('lets a group manager view a leave of a subgroup', function () {
        // create a sub group
        $subgroup =  Group::factory()->create([
            'parent_group_id' => $this->managedGroup->id,
        ]);

        // create a membership (including user) for the sub group
        $subgroupMembership = Membership::factory()->create([
            'group_id' => $subgroup->id,
        ]);

        // create a leave for the user in the sub group
        $subgroupLeave = Leave::factory()->create([
            'user_id' => $subgroupMembership->user_id,
        ]);

        actingAs($this->groupManager)
            ->getJson("/api/leaves/{$subgroupLeave->id}")
            ->assertOk();
    });
});
