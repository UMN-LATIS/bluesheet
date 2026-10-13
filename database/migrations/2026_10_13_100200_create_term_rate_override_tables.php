<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('term_job_code_rate_overrides', function (Blueprint $table) {
            $table->id();
            $table->integer('academic_org');
            $table->integer('term_code');
            $table->string('job_code', 16);
            $table->decimal('cost_per_course', 10, 2);

            $table->unsignedInteger('created_by')->nullable();
            $table->unsignedInteger('updated_by')->nullable();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('updated_by')->references('id')->on('users')->nullOnDelete();

            $table->timestamps();

            $table->unique(['academic_org', 'term_code', 'job_code'], 'term_job_code_rate_overrides_unique');
        });

        Schema::create('term_ta_rate_overrides', function (Blueprint $table) {
            $table->id();
            $table->integer('academic_org');
            $table->integer('term_code');
            $table->decimal('appointment_percent', 5, 2);
            $table->string('student_status');
            $table->decimal('cost_per_term', 10, 2);

            $table->unsignedInteger('created_by')->nullable();
            $table->unsignedInteger('updated_by')->nullable();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('updated_by')->references('id')->on('users')->nullOnDelete();

            $table->timestamps();

            $table->unique(['academic_org', 'term_code', 'appointment_percent', 'student_status'], 'term_ta_rate_overrides_unique');
        });

        Schema::create('term_cost_line_overrides', function (Blueprint $table) {
            $table->id();
            $table->integer('academic_org');
            $table->integer('term_code');
            $table->string('course_code');
            $table->string('class_section');
            $table->integer('emplid');
            $table->decimal('amount', 10, 2);
            $table->text('reason')->nullable();

            $table->unsignedInteger('created_by')->nullable();
            $table->unsignedInteger('updated_by')->nullable();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('updated_by')->references('id')->on('users')->nullOnDelete();

            $table->timestamps();

            $table->unique(['academic_org', 'term_code', 'course_code', 'class_section', 'emplid'], 'term_cost_line_overrides_unique');
        });
    }

    public function down(): void {
        Schema::dropIfExists('term_cost_line_overrides');
        Schema::dropIfExists('term_ta_rate_overrides');
        Schema::dropIfExists('term_job_code_rate_overrides');
    }
};
