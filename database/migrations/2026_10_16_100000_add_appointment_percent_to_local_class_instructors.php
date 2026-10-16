<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('local_class_instructors', function (Blueprint $table) {
            $table->decimal('appointment_percent', 5, 2)->nullable()->after('role');
        });
    }

    public function down(): void {
        Schema::table('local_class_instructors', function (Blueprint $table) {
            $table->dropColumn('appointment_percent');
        });
    }
};
