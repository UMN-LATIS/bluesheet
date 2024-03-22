<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Role as PermissionRole;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void {

        PermissionRole::where('name', 'group admin')->update(['name' => 'global group admin']);
        app()->make(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void {
        PermissionRole::where('name', 'global group admin')->update(['name' => 'group admin']);
        app()->make(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
