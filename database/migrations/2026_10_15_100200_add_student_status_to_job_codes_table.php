<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('job_codes', function (Blueprint $table) {
            $table->string('student_status')->nullable()->after('annual_load');
        });
    }

    public function down(): void {
        Schema::table('job_codes', function (Blueprint $table) {
            $table->dropColumn('student_status');
        });
    }
};
