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

    $this->validLeaveArtifactData = [
        'label' => 'Artifact label',
        'target' => 'https://example.com',
    ];

    $this->superAdmin = User::where('umndid', 'admin')->first();

    $this->editAnyLeavesUser = User::factory()->create();
    $this->editAnyLeavesUser->givePermissionTo(Permissions::EDIT_ANY_LEAVES);
});

it('returns a 401 if the user is not authenticated', function () {
    postJson("/api/leaves/{$this->leave->id}/artifacts", $this->validLeaveArtifactData)
        ->assertUnauthorized();
});

it('does not allow a default user to create leave artifacts', function () {
    actingAs(User::factory()->create())
        ->postJson("/api/leaves/{$this->leave->id}/artifacts", $this->validLeaveArtifactData)
        ->assertForbidden();
});

it('does not allow user to create their own leave artifacts', function () {
    actingAs($this->leaveOwner)
        ->postJson("/api/leaves/{$this->leave->id}/artifacts", $this->validLeaveArtifactData)
        ->assertForbidden();
});

it('lets a user with EDIT_ANY_LEAVES permission to create an artifact', function () {
    actingAs($this->editAnyLeavesUser)
        ->postJson("/api/leaves/{$this->leave->id}/artifacts", $this->validLeaveArtifactData)
        ->assertStatus(201)
        ->assertJsonFragment($this->validLeaveArtifactData)
        ->assertJsonStructure([
            'id',
            'label',
            'target',
            'leave_id',
            'created_at',
            'updated_at',
            'canCurrentUser' => [
                'delete',
                'update'
            ]
        ]);
});

it('fails if required field is missing', function () {
    actingAs($this->editAnyLeavesUser)
        ->postJson("/api/leaves/{$this->leave->id}/artifacts", [])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['label', 'target']);
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

    it('does not let a fellow group member create a leave artifact', function () {
        actingAs($this->fellowGroupMembership->user)
            ->postJson("/api/leaves/{$this->leave->id}/artifacts", $this->validLeaveArtifactData)
            ->assertForbidden();
    });

    it('lets a fellow group member create a leave artifact if they are a BlueSheet Manager', function () {
        promoteUserToGroupManager($this->fellowGroupMembership->user->id, $this->fellowGroupMembership->group->id);

        actingAs($this->fellowGroupMembership->user)
            ->postJson("/api/leaves/{$this->leave->id}/artifacts", $this->validLeaveArtifactData)
            ->assertStatus(201);
    });
});
