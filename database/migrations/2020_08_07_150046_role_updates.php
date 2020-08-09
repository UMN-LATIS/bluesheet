<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleUpdates extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        $user_role = Role::create(['name' => 'basic user']);
        $view_user_role = Role::create(['name' => 'view user']);
        
        $admin_role = Role::create(['name' => 'site admin']);
        $group_admin_role = Role::create(['name' => 'group admin']);
        $super_admin_role = Role::create(['name' => 'super admin']);

        $permission = Permission::create(['name' => 'view own groups']);
        $permission->assignRole($view_user_role);
        $permission->assignRole($user_role);
        $permission->assignRole($admin_role);
        $permission->assignRole($group_admin_role);
        
        $permission = Permission::create(['name' => 'view groups']);
        $permission->assignRole($view_user_role);
        $permission->assignRole($admin_role);
        $permission->assignRole($group_admin_role);
        $permission = Permission::create(['name' => 'view private groups']);
        $permission->assignRole($admin_role);
        $permission->assignRole($group_admin_role);
        $permission = Permission::create(['name' => 'view user']);
        $permission->assignRole($view_user_role);
        $permission->assignRole($admin_role);
        $permission->assignRole($group_admin_role);
        
        $permission = Permission::create(['name' => 'create groups']);
        $permission->assignRole($admin_role);
        $permission->assignRole($group_admin_role);
        $permission = Permission::create(['name' => 'edit groups']);
        $permission->assignRole($admin_role);
        $permission->assignRole($group_admin_role);
        $permission = Permission::create(['name' => 'edit users']);
        $permission->assignRole($admin_role);
        
        $users = \App\User::all();
        foreach($users as $user) {
            if($user->site_permissions == 100) {
                $user->assignRole("basic user");
            }
            if($user->site_permissions == 300) {
                $user->assignRole("group admin");
            }
        }
        Schema::table('users', function(Blueprint $table) {
            $table->dropColumn("site_permissions");
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        //
    }
}
