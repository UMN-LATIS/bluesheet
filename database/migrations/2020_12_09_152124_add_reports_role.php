<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class AddReportsRole extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        $permission = Permission::create(['name' => 'view reports']);
        $role = Role::findByName('group admin');
        $role->givePermissionTo($permission);
        $role = Role::findByName('site admin');
        $role->givePermissionTo($permission);
        $role = Role::findByName('super admin');
        $role->givePermissionTo($permission);
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {

        $role = Role::findByName('group admin');
        $role->revokePermissionTo("view reports");
        $role = Role::findByName('site admin');
        $role->revokePermissionTo("view reports");
        $role = Role::findByName('super admin');
        $role->revokePermissionTo("view reports");
    }
}
