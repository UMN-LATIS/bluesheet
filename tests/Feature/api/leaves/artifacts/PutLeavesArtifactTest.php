<?php

use App\Constants\Permissions;
use App\Leave;
use App\LeaveArtifact;
use App\Membership;
use App\User;
use Database\Seeders\TestDatabaseSeeder;
use function Pest\Laravel\{actingAs, putJson};

beforeEach(function () {
    setupMockBandaidApiResponses();
    $this->seed(TestDatabaseSeeder::class);

    // create a leave
    $this->leaveOwner = User::factory()->create();
    $this->leave = Leave::factory()->create([
        'user_id' => $this->leaveOwner->id,
    ]);

    $this->leaveArtifact = LeaveArtifact::factory()->create([
        'leave_id' => $this->leave->id,
    ]);

    $this->superAdmin = User::where('umndid', 'admin')->first();

    $this->editAnyLeavesUser = User::factory()->create();
    $this->editAnyLeavesUser->givePermissionTo(Permissions::EDIT_ANY_LEAVES);
});

it('returns a 401 if the user is not authenticated', function () {
    putJson("/api/leaves/{$this->leave->id}/artifacts/{$this->leaveArtifact->id}", [
        'label' => 'New label',
    ])
        ->assertUnauthorized();
});

it('does not allow a default user to delete leave artifacts for a leave they do not own', function () {
    actingAs(User::factory()->create())
        ->putJson("/api/leaves/{$this->leave->id}/artifacts/{$this->leaveArtifact->id}", [
            ...$this->leaveArtifact->toArray(),
            'label' => 'New label',
        ])
        ->assertForbidden();
});


it('does not let a user delete their own leave artifacts', function () {
    actingAs($this->leaveOwner)
        ->putJson("/api/leaves/{$this->leave->id}/artifacts/{$this->leaveArtifact->id}", [
            ...$this->leaveArtifact->toArray(),
            'label' => 'New label',
        ])
        ->assertForbidden();
});

it('lets a user with EDIT_ANY_LEAVES permission to delete an artifact', function () {
    actingAs($this->editAnyLeavesUser)
        ->putJson("/api/leaves/{$this->leave->id}/artifacts/{$this->leaveArtifact->id}", [
            ...$this->leaveArtifact->toArray(),
            'label' => 'New label',
        ])
        ->assertOk()
        ->assertJsonFragment([
            'label' => 'New label',
        ])
        ->assertJsonStructure([
            'id',
            'label',
            'target',
            'leave_id',
            'created_at',
            'updated_at',
            'canCurrentUser' => [
                'update',
                'delete',
            ],
        ]);
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

    it('does not let a fellow group member delete a leave artifact', function () {
        actingAs($this->fellowGroupMembership->user)
            ->putJson("/api/leaves/{$this->leave->id}/artifacts/{$this->leaveArtifact->id}", [
                ...$this->leaveArtifact->toArray(),
                'label' => 'New label',
            ])
            ->assertForbidden();
    });

    it('lets a fellow group member delete a leave artifact if they are a BlueSheet Manager', function () {
        promoteUserToGroupManager($this->fellowGroupMembership->user->id, $this->fellowGroupMembership->group->id);

        actingAs($this->fellowGroupMembership->user)
            ->putJson("/api/leaves/{$this->leave->id}/artifacts/{$this->leaveArtifact->id}", [
                ...$this->leaveArtifact->toArray(),
                'label' => 'New label',
            ])
            ->assertOk()
            ->assertJsonFragment([
                'label' => 'New label',
            ]);
    });
});
