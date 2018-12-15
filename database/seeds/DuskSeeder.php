<?php

use Illuminate\Database\Seeder;

class DuskSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $user = new App\User;
        $user->givenname = "Test";
        $user->surname= "User";
        $user->displayName= "Test User";
        $user->email= "test@umn.edu";
        $user->site_permissions= 200;
        $user->save();

		$user2 = new App\User;
        $user2->givenname = "Tes2";
        $user2->surname= "Use2";
        $user2->email= "test2@umn.edu";
        $user2->site_permissions= 100;
        $user2->save();

        $groupType = new App\GroupType;
        $groupType->group_type = "Committee";
        $groupType->save();

        $group = new App\Group;
        $group->group_title = "Test Group";
        $group->groupType()->associate($groupType);
        $group->active_group = 1;
        $group->notes = "these are some notes";
        $group->save();

        $role = new App\Role;
        $role->label = "Chair";
        $role->save();
        
        $role2 = new App\Role;
        $role2->label = "Vice Chair";
        $role2->save();

        $newMember = new \App\Membership;
        $newMember->notes = "test notes";
        $newMember->user()->associate($user);
        $newMember->group()->associate($group);
        $newMember->role()->associate($role);
        $newMember->save();

        $newMember = new \App\Membership;
        $newMember->notes = "more test notes";
        $newMember->user()->associate($user2);
        $newMember->group()->associate($group);
        $newMember->role()->associate($role2);
        $newMember->save();

             


    }
}
