<?php

use App\{User, Group, Membership};
use App\Constants\Permissions;
use Database\Seeders\TestDatabaseSeeder;
use function Pest\Laravel\{getJson, actingAs};

beforeEach(function () {
    $this->seed(TestDatabaseSeeder::class);

    $this->group = Group::factory()->create();

    $this->groupManager = User::factory()->create();
    Membership::factory()->create([
        'user_id' => $this->groupManager->id,
        'group_id' => $this->group->id,
        'admin' => true,
    ]);

    $this->viewer = User::factory()->create()->givePermissionTo(Permissions::VIEW_PLANNED_COURSES);
    $this->basicUser = User::factory()->create();
});

describe('GET /api/permissions/groups/{groupId}/courses', function () {
    it('requires authentication', function () {
        getJson("/api/permissions/groups/{$this->group->id}/courses")
            ->assertUnauthorized();
    });

    it('grants a group manager view and create', function () {
        actingAs($this->groupManager)
            ->getJson("/api/permissions/groups/{$this->group->id}/courses")
            ->assertOk()
            ->assertJson(['viewAny' => true, 'create' => true]);
    });

    it('grants a view-permission user view but not create', function () {
        actingAs($this->viewer)
            ->getJson("/api/permissions/groups/{$this->group->id}/courses")
            ->assertOk()
            ->assertJson(['viewAny' => true, 'create' => false]);
    });

    it('grants a basic user neither view nor create', function () {
        actingAs($this->basicUser)
            ->getJson("/api/permissions/groups/{$this->group->id}/courses")
            ->assertOk()
            ->assertJson(['viewAny' => false, 'create' => false]);
    });
});
