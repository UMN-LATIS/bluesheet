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
            $table->integer('emplid');
            $table->foreign('emplid')->references('emplid')->on('sis_employees');

            $table->string('dept_id');
            $table->foreign('dept_id')->references('dept_id')->on('sis_departments');

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
