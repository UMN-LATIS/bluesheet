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

    $this->superAdmin = User::where('umndid', 'admin')->first();


    $this->validLeaveData = [
        'description' => 'New leave',
        'start_date' => '2021-01-01',
        'end_date' => '2021-01-02',
        'status' => 'pending',
        'type' => 'development',
        'user_id' => $this->superAdmin->id,
    ];
});

it('returns 401 for unauthenticated user', function () {
    postJson('/api/leaves', $this->validLeaveData)
        ->assertStatus(401);
});


it('does not let a default user create a leave', function () {
    actingAs(User::factory()->create())
        ->postJson('/api/leaves', $this->validLeaveData)
        ->assertStatus(403);
});

it('creates a leave', function (User $user) {
    actingAs($user)
        ->postJson('/api/leaves', $this->validLeaveData)
        ->assertStatus(201);
})->with([
    'super admin' => fn () => $this->superAdmin,
    'user with edit leaves permission' => fn () => User::factory()->create()->givePermissionTo(Permissions::EDIT_ANY_LEAVES),
]);

it('fails if required field is missing', function () {
    $userCanEditLeaves = User::factory()->create()->givePermissionTo(Permissions::EDIT_ANY_LEAVES);

    actingAs($userCanEditLeaves)
        ->postJson('/api/leaves', [])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['user_id', 'description', 'start_date', 'end_date', 'status', 'type']);
});

it('fails if user_id is not a valid user', function () {
    $userCanEditLeaves = User::factory()->create()->givePermissionTo(Permissions::EDIT_ANY_LEAVES);

    $postData = [
        ...$this->validLeaveData,
        'user_id' => 999999,
    ];

    actingAs($userCanEditLeaves)
        ->postJson('/api/leaves', $postData)
        ->assertStatus(422)
        ->assertJsonValidationErrors(['user_id']);
});

it('fails if description is too long', function () {
    $userCanEditLeaves = User::factory()->create()->givePermissionTo(Permissions::EDIT_ANY_LEAVES);

    $postData = [
        ...$this->validLeaveData,
        'description' => str_repeat('a', 256),
    ];

    actingAs($userCanEditLeaves)
        ->postJson('/api/leaves', $postData)
        ->assertStatus(422)
        ->assertJsonValidationErrors(['description']);
});

it('fails if start_date or end_date are not dates', function () {
    $userCanEditLeaves = User::factory()->create()->givePermissionTo(Permissions::EDIT_ANY_LEAVES);

    $postData = [
        ...$this->validLeaveData,
        'start_date' => 'not a date',
        'end_date' => 'not a date',
    ];

    actingAs($userCanEditLeaves)
        ->postJson('/api/leaves', $postData)
        ->assertStatus(422)
        ->assertJsonValidationErrors(['start_date', 'end_date']);
});

it('fails if end_date is before start_date', function () {
    $userCanEditLeaves = User::factory()->create()->givePermissionTo(Permissions::EDIT_ANY_LEAVES);

    $postData = [
        ...$this->validLeaveData,
        'start_date' => '2021-01-02',
        'end_date' => '2021-01-01',
    ];

    actingAs($userCanEditLeaves)
        ->postJson('/api/leaves', $postData)
        ->assertStatus(422)
        ->assertJsonValidationErrors(['end_date']);
});

it('fails if status or type is not valid', function () {
    $userCanEditLeaves = User::factory()->create()->givePermissionTo(Permissions::EDIT_ANY_LEAVES);

    $postData = [
        ...$this->validLeaveData,
        'status' => 'not a valid status',
        'type' => 'not a valid type',
    ];

    actingAs($userCanEditLeaves)
        ->postJson('/api/leaves', $postData)
        ->assertStatus(422)
        ->assertJsonValidationErrors(['status', 'type']);
});

describe('as a fellow group member', function () {
    beforeEach(function () {
        // create a leave, which will also create the leave owner
        $this->leave = Leave::factory()->create();

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

    it('lets a BlueSheet manager create a new leave for a group member', function () {
        // promote the fellow group member to a group manager
        promoteUserToGroupManager($this->fellowGroupMembership->user_id, $this->fellowGroupMembership->group_id);

        actingAs($this->fellowGroupMembership->user)
            ->postJson('/api/leaves', [
                ...$this->validLeaveData,
                'user_id' => $this->leave->user_id,
            ])
            ->assertStatus(201);
    });

    it('does not let a non-managing member create a leave for another member', function () {
        actingAs($this->fellowGroupMembership->user)
            ->postJson('/api/leaves', [
                ...$this->validLeaveData,
                'user_id' => $this->leave->user_id,
            ])
            ->assertStatus(403);
    });
});
