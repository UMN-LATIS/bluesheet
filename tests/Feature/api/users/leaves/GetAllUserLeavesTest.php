<?php

use App\Constants\Permissions;
use App\Leave;
use App\Membership;
use App\User;
use App\Group;
use Database\Seeders\TestDatabaseSeeder;
use Illuminate\Support\Facades\Http;

use function Pest\Laravel\{postJson, getJson, actingAs, deleteJson};

beforeEach(function () {
    setupMockBandaidApiResponses();
    $this->seed(TestDatabaseSeeder::class);

    // Create a leave entry
    $this->leaveOwner = User::factory()->create();
    $this->leaves = Leave::factory()->count(3)->create(
        ['user_id' => $this->leaveOwner->id]
    );

    // super admin
    $this->superAdmin = User::where('umndid', 'admin')->first();

    // user with VIEW_ANY_LEAVES permission
    $this->viewAnyLeavesUser = User::factory()->create();
    $this->viewAnyLeavesUser->givePermissionTo(Permissions::VIEW_ANY_LEAVES);
});

it('lets a user view all of their leaves', function () {
    actingAs($this->leaveOwner)
        ->getJson("/api/users/{$this->leaveOwner->id}/leaves")
        ->assertOk()
        ->assertJsonCount(3)
        ->assertJsonStructure([
            '*' => [
                "id",
                "user",
                "user_id",
                "description",
                "start_date",
                "end_date",
                "type",
                "status",
                "canCurrentUser",
            ],
        ]);
});

it('lets a user with VIEW_ANY_LEAVES permission view all leaves for another user ', function () {
    actingAs($this->viewAnyLeavesUser)
        ->getJson("/api/users/{$this->leaveOwner->id}/leaves")
        ->assertOk()
        ->assertJsonCount(3)
        ->assertJsonStructure([
            '*' => [
                "id",
                "user",
                "user_id",
                "description",
                "start_date",
                "end_date",
                "type",
                "status",
                "canCurrentUser",
            ],
        ]);
});

it('does not permit users to view leaves for other users', function () {
    actingAs(User::factory()->create())
        ->getJson("/api/users/{$this->leaveOwner->id}/leaves")
        ->assertForbidden();
});


it('does not allow unauthenticated users to view leaves', function () {
    getJson("/api/users/{$this->leaveOwner->id}/leaves")
        ->assertUnauthorized();
});

it('does not allow a user to view leaves for a user that does not exist', function () {
    actingAs($this->viewAnyLeavesUser)
        ->getJson("/api/users/999999/leaves")
        ->assertNotFound();
});

it('lets BlueSheet Managers view leaves of any instructors in their group\'s department', function () {
    // create a membership for the BlueSheet Manager
    // which will create the group and the user
    $blueSheetManagerMembership = Membership::factory()->create();
    $blueSheetManager = $blueSheetManagerMembership->user;
    $blueSheetManagerGroup = $blueSheetManagerMembership->group;

    // promote the BlueSheet Manager to a group manager
    promoteUserToGroupManager($blueSheetManager->id, $blueSheetManagerGroup->id);

    // give our group a dept_id
    $blueSheetManagerGroup->dept_id = 123;
    $blueSheetManagerGroup->save();

    // our mock Bandaid getDeptClassList(123)
    // will return classes for an instructor with emplid
    // of 102
    // so our bluesheet manager should be able to see
    // any leaves for user with emplid 102

    // let's give them a leave
    $instructor = User::factory()->create(['emplid' => 102]);
    $leave = Leave::factory()->create(['user_id' => $instructor->id]);

    // now verify that the BlueSheet Manager can see the leave
    actingAs($blueSheetManager)
        ->getJson("/api/users/{$instructor->id}/leaves")
        ->assertOk()
        ->assertJsonCount(1);
});

it('does not let BlueSheet Managers view leaves of instructors outside their group\'s department', function () {
    // create a membership for the BlueSheet Manager
    // which will create the group and the user
    $managerMembership = Membership::factory()->create();

    // promote user to group manager
    promoteUserToGroupManager($managerMembership->user_id, $managerMembership->group_id);

    $manager = $managerMembership->user;
    $group = $managerMembership->group;
    $deptId = $group->dept_id;


    // create an instructor who will be in our
    // dept but not in our group
    $instructor1 = User::factory()->create();

    // create an instructor who will not be in our department
    $instructor2 = User::factory()->create();

    // clear any existing fake HTTP responses
    // so that we can set up a new Bandaid API response
    clearExistingHttpFakes();

    $BANDAID_API = config('bandaid.baseUri');
    Http::fake([
        // Now, put the $instructor1 in the mock
        // reponse for getEmployeesForDept($deptId)
        "{$BANDAID_API}/classes/list/{$deptId}" => Http::response([
            ['INSTRUCTOR_EMPLID' => $instructor1->emplid]
        ]),

        // and the $instructor2 in the mock response
        // for getEmployeesForDept($deptId + 1)
        "{$BANDAID_API}/classes/list/" . ($deptId + 1) => Http::response([
            ['INSTRUCTOR_EMPLID' => $instructor2->emplid]
        ]),
    ]);

    // finally, let's check that we can see the leaves of the instructor in
    // our department (this is just a sanity check that we
    // have set up our test correctly)
    actingAs($manager)
        ->getJson("/api/users/{$instructor1->id}/leaves")
        ->assertOk();

    // and then attempt to get a leave for the instructor not in our departmemt
    // which should fail
    actingAs($manager)
        ->getJson("/api/users/{$instructor2->id}/leaves")
        ->assertForbidden();

    // but if we change the department of the group to the department
    // of the instructor, we should be able to see their leaves
    $group->dept_id = $deptId + 1;
    $group->save();

    actingAs($manager)
        ->getJson("/api/users/{$instructor2->id}/leaves")
        ->assertOk();

    // and now we should no longer be able to get the leaves of the instructor1
    actingAs($manager)
        ->getJson("/api/users/{$instructor1->id}/leaves")
        ->assertForbidden();
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

    it('lets a BlueSheet manager get any member\'s leaves', function () {
        promoteUserToGroupManager($this->fellowGroupMembership->user->id, $this->fellowGroupMembership->group->id);

        actingAs($this->fellowGroupMembership->user)
            ->getJson("/api/users/{$this->leaveOwner->id}/leaves")
            ->assertOk();
    });

    it('does not allow a group member to view another user\'s leaves', function () {
        actingAs($this->fellowGroupMembership->user)
            ->getJson("/api/users/{$this->leaveOwner->id}/leaves")
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

    it('lets a group manager view all subgroup member leaves', function () {
        // create a sub group
        $subgroup =  Group::factory()->create([
            'parent_group_id' => $this->managedGroup->id,
        ]);

        // create a membership (including user) for the sub group
        $subgroupMembership = Membership::factory()->create([
            'group_id' => $subgroup->id,
        ]);

        $subgroupUserId = $subgroupMembership->user_id;

        // create a leave for the user in the sub group
        $subgroupLeave = Leave::factory()->create([
            'user_id' => $subgroupUserId,
        ]);

        actingAs($this->groupManager)
            ->getJson("/api/users/{$subgroupUserId}/leaves")
            ->assertOk();
    });
});
