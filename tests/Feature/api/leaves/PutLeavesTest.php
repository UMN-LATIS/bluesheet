<?php

use App\Constants\Permissions;
use App\Leave;
use App\Membership;
use App\User;
use Database\Seeders\TestDatabaseSeeder;
use function Pest\Laravel\{postJson, getJson, actingAs, deleteJson, putJson};

beforeEach(function () {
    setupMockBandaidApiResponses();
    $this->seed(TestDatabaseSeeder::class);

    $this->leave = Leave::factory()->create();
    $this->superAdmin = User::where('umndid', 'admin')->first();
});

it('returns 401 for unauthenticated user', function () {
    putJson("/api/leaves/{$this->leave->id}", [
        ...$this->leave->toArray(),
        'description' => 'Updated leave',
    ])->assertStatus(401);
});

it('does not let a default user update a leave', function () {
    actingAs(User::factory()->create())
        ->putJson("/api/leaves/{$this->leave->id}", [
            ...$this->leave->toArray(),
            'description' => 'Updated leave',
        ])
        ->assertStatus(403);
});

it('updates a leave', function (User $user) {
    actingAs($user)
        ->putJson("/api/leaves/{$this->leave->id}", [
            ...$this->leave->toArray(),
            'description' => 'Updated leave',
        ])
        ->assertStatus(200);
})->with([
    'super admin' => fn () => $this->superAdmin,
    'user with edit leaves permission' => fn () => User::factory()->create()->givePermissionTo(Permissions::EDIT_ANY_LEAVES),
]);

it('does not permit a leave owner (without edit privileges) to update their leave', function () {
    actingAs($this->leave->user)
        ->putJson("/api/leaves/{$this->leave->id}", [
            ...$this->leave->toArray(),
            'description' => 'Updated leave',
        ])
        ->assertStatus(403);
});

it('fails if required field is missing', function () {
    $userCanEditLeaves = User::factory()->create()->givePermissionTo(Permissions::EDIT_ANY_LEAVES);

    actingAs($userCanEditLeaves)
        ->putJson("/api/leaves/{$this->leave->id}", [])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['user_id', 'description', 'start_date', 'end_date', 'status', 'type']);
});

it('fails if user_id is not a valid user', function () {
    $userCanEditLeaves = User::factory()->create()->givePermissionTo(Permissions::EDIT_ANY_LEAVES);

    $postData = [
        ...$this->leave->toArray(),
        'user_id' => 999999,
    ];

    actingAs($userCanEditLeaves)
        ->putJson("/api/leaves/{$this->leave->id}", $postData)
        ->assertStatus(422)
        ->assertJsonValidationErrors(['user_id']);
});

it('fails if description is too long', function () {
    $userCanEditLeaves = User::factory()->create()->givePermissionTo(Permissions::EDIT_ANY_LEAVES);

    $postData = [
        ...$this->leave->toArray(),
        'description' => str_repeat('a', 256),
    ];

    actingAs($userCanEditLeaves)
        ->putJson("/api/leaves/{$this->leave->id}", $postData)
        ->assertStatus(422)
        ->assertJsonValidationErrors(['description']);
});

it('fails if start_date or end_date are not dates', function () {
    $userCanEditLeaves = User::factory()->create()->givePermissionTo(Permissions::EDIT_ANY_LEAVES);

    $postData = [
        ...$this->leave->toArray(),
        'start_date' => 'not a date',
        'end_date' => 'not a date',
    ];

    actingAs($userCanEditLeaves)
        ->putJson("/api/leaves/{$this->leave->id}", $postData)
        ->assertStatus(422)
        ->assertJsonValidationErrors(['start_date', 'end_date']);
});

it('fails if end_date is before start_date', function () {
    $userCanEditLeaves = User::factory()->create()->givePermissionTo(Permissions::EDIT_ANY_LEAVES);

    $postData = [
        ...$this->leave->toArray(),
        'start_date' => '2021-01-02',
        'end_date' => '2021-01-01',
    ];

    actingAs($userCanEditLeaves)
        ->putJson("/api/leaves/{$this->leave->id}", $postData)
        ->assertStatus(422)
        ->assertJsonValidationErrors(['end_date']);
});

describe('as a fellow group member', function () {
    beforeEach(function () {
        // create a membership for the leave owner
        // which will also create the group for our test
        $leaveUserMembership = Membership::factory()->create([
            'user_id' => $this->leave->user_id,
        ]);

        // then create another membership within the group
        // which we can promote (or not) to a BlueSheet Manager
        $this->fellowGroupMembership = Membership::factory()->create([
            'group_id' => $leaveUserMembership->group_id,
        ]);
    });

    it('does not let a fellow group member update a leave', function () {
        actingAs($this->fellowGroupMembership->user)
            ->putJson("/api/leaves/{$this->leave->id}", [
                ...$this->leave->toArray(),
                'description' => 'Updated leave',
            ])
            ->assertStatus(403);
    });

    it('lets a BlueSheet manager update a member\'s leave', function () {
        // promote the fellow group member to a group manager
        promoteUserToGroupManager($this->fellowGroupMembership->user_id, $this->fellowGroupMembership->group_id);

        actingAs($this->fellowGroupMembership->user)
            ->putJson("/api/leaves/{$this->leave->id}", [
                ...$this->leave->toArray(),
                'description' => 'Updated leave',
            ])
            ->assertStatus(200);
    });
});
