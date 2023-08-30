<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class GroupsOfficialRolesControl extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create("group_type_role", function(Blueprint $table) {
            $table->integer('group_type_id')->unsigned();
            $table->foreign('group_type_id')->references('id')->on('group_types')->onDelete('cascade');
            $table->integer('role_id')->unsigned();
            $table->foreign('role_id')->references('id')->on('roles')->onDelete('cascade');
        });

        $department = \App\GroupType::where("label", "Department")->first();
        $roles = \App\Role::all();
        foreach($roles as $role) {
            if($role->official_department_role) {
                $role->officialGroupType()->attach($department->id);
                $role->save();
            }
        }
        Schema::table("roles", function(Blueprint $table) {
            $table->dropColumn("official_department_role");
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::drop('group_type_role');
    }
}
