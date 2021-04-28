<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class UpgradeExistingRoles extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        $users = \App\User::all();
        foreach($users as $user) {
            if(!$user->hasRole("view user")) {
                $user->assignRole("view user");
            }
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        $users = \App\User::all();
        foreach($users as $user) {
            if($user->hasRole("view user")) {
                $user->removeRole("view user");
            }
        }
    }
}
