<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

return new class extends Migration {
    /**
     * Run the migrations.
     *
     * @return void
     */

    public function up() {
        collect([
            'view planned courses',
            'edit planned courses',
        ])->each(
            fn ($perm) => Permission::firstOrCreate(['name' => $perm])
        );

        Role::whereIn('name', [
            'group admin',
            'site admin',
        ])
            ->get()
            ->each(function ($role) {
                $role->givePermissionTo('view planned courses');
                $role->givePermissionTo('edit planned courses');
            });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down() {
        Permission::whereIn('name', [
            'view planned courses',
            'edit planned courses',
        ])->delete();
    }
};
