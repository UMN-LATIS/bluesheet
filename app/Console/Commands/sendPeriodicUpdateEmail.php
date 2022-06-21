<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class sendPeriodicUpdateEmail extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'email:periodicUpdate';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send Periodic Updates';

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
        $users = \App\User::where("send_email_reminders", 1)->get();
        foreach($users as $user) {
            $userGroups = $user->groups->filter(function ($group) use ($user) {
                $activeMembers = $group->activeMembers->filter(function($member) use ($user) {
                    return $member->user->id == $user->id;
                });
                $adminRoles = $activeMembers->filter(function($member) {
                    return $member->admin;
                });
                return $adminRoles->count() > 0;
            });
            // should be groups where we're an admin
            if($userGroups->count() > 0) {
                Mail::to($user->email)->send(new \App\Mail\GroupUpdateReminder($userGroups));
            }
            

        }
    }
}
