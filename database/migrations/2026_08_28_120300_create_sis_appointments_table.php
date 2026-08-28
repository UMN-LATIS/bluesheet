<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('sis_appointments', function (Blueprint $table) {
            $table->id();

            // one row per job, not per person: a chair who also holds a
            // professorship has two rows in the same department
            $table->integer('emplid')->index();
            $table->string('dept_id')->index();

            $table->string('dept_name')->nullable();
            $table->string('job_code');
            $table->string('position_desc')->nullable();
            $table->string('category')->nullable();
            $table->string('job_indicator')->nullable();
            $table->timestamps();

            $table->unique(['emplid', 'dept_id', 'job_code', 'job_indicator'], 'sis_appointments_job_unique');
        });
    }

    public function down(): void {
        Schema::dropIfExists('sis_appointments');
    }
};
