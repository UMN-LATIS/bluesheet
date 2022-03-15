<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use DB;
use Carbon\Carbon;
use Mail;

class EmailForFavoriteGroupsAndRoles extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'email:favorites';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Email users when their favorite groups and roles change';

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $outputArray = [];

        $favoriteGroups = DB::table("favorite_groups")->get();
        foreach($favoriteGroups as $favoriteGroup) {
            $groupId = $favoriteGroup->group_id;
            $userId = $favoriteGroup->user_id;
            $user = \App\User::find($userId);
            $groupChangeArray = [];
            if(!$user->notify_of_favorite_changes) {
                continue;
            }

            $group = \App\Group::find($groupId);
            $changes = $group->members()->where("updated_at", ">", Carbon::now()->subDay())->get();
            
            foreach($changes as $change) {
                $groupChangeArray[] = $change;
            }

            
            if(count($groupChangeArray) > 0) {
                if(!isset($outputArray[$userId])) {
                    $outputArray[$userId] = ["user"=>$user, "favorites"=>[]];
                }
                $outputArray[$userId]["favorites"][] = [
                    "category"=>$group->group_title,
                    "link"=>url("/group/".$group->id),
                    "changes"=> $groupChangeArray
                ];
            }
        }
        
        $favoriteRoles = DB::table("favorite_roles")->get();
        foreach($favoriteRoles as $favoriteRole) {
            $roleId = $favoriteRole->role_id;
            $userId = $favoriteGroup->user_id;
            $user = \App\User::find($userId);
            $roleChangeArray = [];
            if(!$user->notify_of_favorite_changes) {
                continue;
            }
            $role = \App\Role::find($roleId);
            $changes = $role->members()->where("updated_at", ">", Carbon::now()->subDay())->get();
            foreach($changes as $change) {
                $roleChangeArray[] = $change;
            }

            
            if(count($roleChangeArray) > 0) {
                if(!isset($outputArray[$userId])) {
                    $outputArray[$userId] = ["user"=>$user, "favorites"=>[]];
                }
                $outputArray[$userId]["favorites"][] = [
                    "category"=>$role->label,
                    "link"=>url("/role/".$role->id),
                    "changes"=> $roleChangeArray
                ];
            }
        }


        foreach($outputArray as $userChanges) {
            Mail::to($userChanges["user"]->email)->send(new \App\Mail\GroupUpdateReminder(collect($userChanges["favorites"])));
        }
        
    }
}
