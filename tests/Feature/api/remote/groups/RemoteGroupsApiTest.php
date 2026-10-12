<?php

use App\Group;
use App\User;
use Database\Seeders\TestDatabaseSeeder;

use function Pest\Laravel\getJson;

beforeEach(function () {
    $this->seed(TestDatabaseSeeder::class);
    $this->basicUser = User::where('umndid', 'basic_user')->first();
});

describe("GET /api/remote/groups", function () {
    it('returns a 401 with invalid token', function () {
        $res = getJson('/api/remote/groups', [
            'Authorization' => 'Bearer invalid_token'
        ]);

        expect($res->status())->toBe(401);
    });

    it('returns active and inactive groups with their parent and group type', function () {
        $parent = Group::factory()->create();
        $inactiveChild = Group::factory()->create([
            'active_group' => false,
            'parent_group_id' => $parent->id,
        ]);
        $token = $this->basicUser->createToken('test_token', ['*'])->plainTextToken;

        $res = getJson('/api/remote/groups', [
            'Authorization' => 'Bearer ' . $token,
        ]);

        expect($res->status())->toBe(200);

        $group = collect($res->json())->firstWhere('id', $inactiveChild->id);

        expect(array_keys($group))->toEqualCanonicalizing([
            'id',
            'group_title',
            'dept_id',
            'parent_group_id',
            'parent_organization_id',
            'active_group',
            'group_type_id',
            'group_type',
            'deleted_at',
        ]);
        expect($group['active_group'])->toBe(0);
        expect($group['parent_group_id'])->toBe($parent->id);
        expect($group['group_type'])->toBe([
            'id' => $inactiveChild->group_type_id,
            'label' => $inactiveChild->groupType->label,
        ]);
    });

    it("includes soft-deleted groups so every child's parent_group_id is in the payload", function () {
        $deletedParent = Group::factory()->create();
        $child = Group::factory()->create(['parent_group_id' => $deletedParent->id]);
        $deletedParent->delete();
        $token = $this->basicUser->createToken('test_token', ['*'])->plainTextToken;

        $res = getJson('/api/remote/groups', [
            'Authorization' => 'Bearer ' . $token,
        ]);

        $groupsById = collect($res->json())->keyBy('id');
        expect($groupsById[$child->id]['parent_group_id'])->toBe($deletedParent->id);
        expect($groupsById[$deletedParent->id]['deleted_at'])->not()->toBeNull();
        expect($groupsById[$child->id]['deleted_at'])->toBeNull();
    });
});
