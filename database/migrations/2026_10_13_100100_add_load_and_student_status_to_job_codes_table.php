<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('job_codes', function (Blueprint $table) {
            $table->string('instructor_type')->nullable()->change();
            $table->unsignedTinyInteger('annual_load')->nullable()->after('instructor_type');
            $table->string('student_status')->nullable()->after('annual_load');
        });
    }

    public function down(): void {
        Schema::table('job_codes', function (Blueprint $table) {
            $table->dropColumn(['annual_load', 'student_status']);
            $table->string('instructor_type')->nullable(false)->change();
        });
    }
};
