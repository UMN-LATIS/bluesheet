<?php

use App\Constants\Permissions;
use App\Leave;
use App\LeaveArtifact;
use App\Membership;
use App\User;
use Database\Seeders\TestDatabaseSeeder;
use function Pest\Laravel\{postJson, getJson, actingAs, deleteJson};

beforeEach(function () {
    setupMockBandaidApiResponses();
    $this->seed(TestDatabaseSeeder::class);

    // create a leave
    $this->leaveOwner = User::factory()->create();
    $this->leave = Leave::factory()->create([
        'user_id' => $this->leaveOwner->id,
    ]);

    // create some leave artifacts
    $this->leaveArtifacts = LeaveArtifact::factory()->count(3)->create([
        'leave_id' => $this->leave->id,
    ]);

    // and some common test users
    // super admin
    $this->superAdmin = User::where('umndid', 'admin')->first();

    // user with VIEW_ANY_LEAVES permission
    $this->viewAnyLeavesUser = User::factory()->create();
    $this->viewAnyLeavesUser->givePermissionTo(Permissions::VIEW_ANY_LEAVES);
});

it('returns a 401 if the user is not authenticated', function () {
    getJson("/api/leaves/{$this->leave->id}/artifacts")
        ->assertUnauthorized();
});

it('does not allow a default user to view leave artifacts for a leave they do not own', function () {
    actingAs(User::factory()->create())
        ->getJson("/api/leaves/{$this->leave->id}/artifacts")
        ->assertForbidden();
});

it('lets a user view their own leave artifacts', function () {
    actingAs($this->leaveOwner)
        ->getJson("/api/leaves/{$this->leave->id}/artifacts")
        ->assertOk()
        ->assertJsonCount(3)
        ->assertJsonStructure([
            '*' => [
                "id",
                "leave_id",
                "label",
                "target",
                "created_at",
                "updated_at",
            ],
        ]);
});

it('lets a user with VIEW_ANY_LEAVES permission view all of a leave\'s artifacts', function () {
    actingAs($this->viewAnyLeavesUser)
        ->getJson("/api/leaves/{$this->leave->id}/artifacts")
        ->assertOk()
        ->assertJsonCount(3);
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

    it('lets a BlueSheet manager view leave artifacts of a group member', function () {
        promoteUserToGroupManager($this->fellowGroupMembership->user->id, $this->fellowGroupMembership->group->id);

        actingAs($this->fellowGroupMembership->user)
            ->getJson("/api/leaves/{$this->leave->id}/artifacts")
            ->assertOk()
            ->assertJsonCount(3);
    });

    it('does not allow a group member to view leave artifacts of a group member if they are not a BlueSheet Manager', function () {
        actingAs($this->fellowGroupMembership->user)
            ->getJson("/api/leaves/{$this->leave->id}/artifacts")
            ->assertForbidden();
    });
});
