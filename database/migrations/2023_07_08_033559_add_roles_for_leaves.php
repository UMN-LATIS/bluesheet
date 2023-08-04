<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        $permissionViewLeaves = Permission::create(['name' => 'view leaves']);
        $permissionEditLeaves = Permission::create(['name' => 'edit leaves']);
        $permissionSchedule = Permission::create(['name' => 'schedule departments']);
        $role = Role::findByName('group admin');
        $role->givePermissionTo($permissionViewLeaves);
        $role->givePermissionTo($permissionEditLeaves);
        $role->givePermissionTo($permissionSchedule);
        $role = Role::findByName('site admin');
        $role->givePermissionTo($permissionViewLeaves);
        $role->givePermissionTo($permissionEditLeaves);
        $role->givePermissionTo($permissionSchedule);
        $role = Role::findByName('super admin');
        $role->givePermissionTo($permissionViewLeaves);
        $role->givePermissionTo($permissionEditLeaves);
        $role->givePermissionTo($permissionSchedule);
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        $role = Role::findByName('group admin');
        $role->revokePermissionTo("view leaves");
        $role->revokePermissionTo("edit leaves");
        $role->revokePermissionTo("schedule departments");
        $role = Role::findByName('site admin');
        $role->revokePermissionTo("view leaves");
        $role->revokePermissionTo("edit leaves");
        $role->revokePermissionTo("schedule departments");
        $role = Role::findByName('super admin');
        $role->revokePermissionTo("view leaves");
        $role->revokePermissionTo("edit leaves");
        $role->revokePermissionTo("schedule departments");
    }
};
