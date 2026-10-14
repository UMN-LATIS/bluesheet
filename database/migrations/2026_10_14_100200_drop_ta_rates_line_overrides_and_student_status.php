<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::dropIfExists('term_cost_line_overrides');
        Schema::dropIfExists('term_ta_rate_overrides');
        Schema::dropIfExists('ta_appointment_rates');

        Schema::table('job_codes', function (Blueprint $table) {
            $table->dropColumn('student_status');
        });
    }

    public function down(): void {
        Schema::table('job_codes', function (Blueprint $table) {
            $table->string('student_status')->nullable()->after('annual_load');
        });

        Schema::create('ta_appointment_rates', function (Blueprint $table) {
            $table->id();
            $table->unsignedSmallInteger('fiscal_year');
            $table->string('season');
            $table->string('student_status');
            $table->decimal('appointment_percent', 5, 2);
            $table->decimal('cost_per_term', 10, 2);
            $table->string('source')->nullable();
            $table->timestamps();

            $table->unique(
                ['fiscal_year', 'season', 'student_status', 'appointment_percent'],
                'ta_appointment_rates_unique'
            );
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

            $table->unsignedInteger('created_by')->nullable();
            $table->unsignedInteger('updated_by')->nullable();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('updated_by')->references('id')->on('users')->nullOnDelete();

            $table->timestamps();

            $table->unique(['academic_org', 'term_code', 'course_code', 'class_section', 'emplid'], 'term_cost_line_overrides_unique');
        });
    }
};
