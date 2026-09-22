<?php

use App\Group;
use App\Leave;
use App\Membership;
use App\SisAppointment;
use App\SisDepartment;
use App\SisEmployee;
use App\User;
use Database\Seeders\TestDatabaseSeeder;

use function Pest\Laravel\actingAs;

// Whom the Bandaid class-list fixture teaches. Give one
// of these to the refusal test and it passes because the
// policy's instructor branch grants access, not because
// the endpoint refused.
const FIXTURE_INSTRUCTOR_EMPLIDS = [100, 101, 102, 103, 1674106];

beforeEach(function () {
    $this->seed(TestDatabaseSeeder::class);
    setupMockBandaidApiResponses();

    $this->department = SisDepartment::factory()->create(['dept_id' => '22222']);
    $this->group = Group::factory()->create(['dept_id' => $this->department->dept_id]);
    $this->url = "/api/leave-planning/groups/{$this->group->id}/leaves";

    $this->manager = User::factory()->create();
    Membership::factory()->create([
        'user_id' => $this->manager->id,
        'group_id' => $this->group->id,
        'admin' => true,
    ]);

    $this->leavePayload = [
        'description' => 'Fieldwork in Oaxaca',
        'start_date' => '2026-09-01',
        'end_date' => '2026-12-31',
        'status' => Leave::STATUS_CONFIRMED,
        'type' => Leave::TYPE_SABBATICAL,
    ];
});

function createAppointedPerson(int $emplid, string $deptId = '22222'): void {
    SisEmployee::factory()->create(['emplid' => $emplid]);
    SisAppointment::factory()->create(['emplid' => $emplid, 'dept_id' => $deptId]);
}

function countLeavesOwnedBy(int $emplid): int {
    return Leave::whereHas('user', fn($query) => $query->where('emplid', $emplid))->count();
}

describe('POST /api/leave-planning/groups/:groupId/leaves', function () {
    it('creates a leave for someone in a group the user manages', function () {
        createAppointedPerson(5000001);
        $owner = User::factory()->create(['emplid' => 5000001]);
        Membership::factory()->create([
            'user_id' => $owner->id,
            'group_id' => $this->group->id,
        ]);

        actingAs($this->manager)
            ->postJson($this->url, [...$this->leavePayload, 'emplid' => 5000001])
            ->assertOk()
            ->assertJson([
                'emplid' => 5000001,
                'userId' => $owner->id,
                'type' => Leave::TYPE_SABBATICAL,
                'status' => Leave::STATUS_CONFIRMED,
                'description' => 'Fieldwork in Oaxaca',
            ]);

        expect(countLeavesOwnedBy(5000001))->toBe(1);
    });

    it('refuses an appointee who is in no group the user manages', function () {
        expect(FIXTURE_INSTRUCTOR_EMPLIDS)->not->toContain(5000002);

        createAppointedPerson(5000002);
        User::factory()->create(['emplid' => 5000002]);

        actingAs($this->manager)
            ->postJson($this->url, [...$this->leavePayload, 'emplid' => 5000002])
            ->assertForbidden();

        expect(countLeavesOwnedBy(5000002))->toBe(0);
    });

    it('creates the BlueSheet user for an appointee who has none', function () {
        createAppointedPerson(100);

        expect(User::where('emplid', 100)->exists())->toBeFalse();

        actingAs($this->manager)
            ->postJson($this->url, [...$this->leavePayload, 'emplid' => 100])
            ->assertOk();

        $owner = User::where('emplid', 100)->first();
        expect($owner)->not->toBeNull();
        expect(countLeavesOwnedBy(100))->toBe(1);
    });

    it('rejects an emplid with no appointment in the department', function () {
        SisEmployee::factory()->create(['emplid' => 5000003]);

        actingAs($this->manager)
            ->postJson($this->url, [...$this->leavePayload, 'emplid' => 5000003])
            ->assertStatus(422)
            ->assertJsonValidationErrors('emplid');

        expect(countLeavesOwnedBy(5000003))->toBe(0);
    });

    it('refuses a user who may not create leaves for the group', function () {
        createAppointedPerson(5000004);
        User::factory()->create(['emplid' => 5000004]);

        actingAs(User::where('umndid', 'basic_user')->first())
            ->postJson($this->url, [...$this->leavePayload, 'emplid' => 5000004])
            ->assertForbidden();

        expect(countLeavesOwnedBy(5000004))->toBe(0);
    });

    it('rejects an end date on or before the start date', function () {
        createAppointedPerson(5000005);
        $owner = User::factory()->create(['emplid' => 5000005]);
        Membership::factory()->create([
            'user_id' => $owner->id,
            'group_id' => $this->group->id,
        ]);

        actingAs($this->manager)
            ->postJson($this->url, [
                ...$this->leavePayload,
                'emplid' => 5000005,
                'end_date' => $this->leavePayload['start_date'],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('end_date');
    });
});
