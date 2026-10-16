<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::dropIfExists('term_job_code_rate_overrides');
        Schema::dropIfExists('term_grad_rate_overrides');
        Schema::dropIfExists('term_grad_hours_overrides');

        Schema::table('grad_term_rates', function (Blueprint $table) {
            $table->decimal('default_appointment_percent', 5, 2)->default(25)->after('per_credit_payment');
        });
    }

    public function down(): void {
        Schema::table('grad_term_rates', function (Blueprint $table) {
            $table->dropColumn('default_appointment_percent');
        });

        Schema::create('term_grad_hours_overrides', function (Blueprint $table) {
            $table->id();
            $table->integer('academic_org');
            $table->integer('term_code');
            $table->decimal('appointment_percent', 5, 2);
            $table->unsignedSmallInteger('hours');
            $this->addAuditColumns($table);

            $table->unique(['academic_org', 'term_code', 'appointment_percent'], 'term_grad_hours_overrides_unique');
        });

        Schema::create('term_grad_rate_overrides', function (Blueprint $table) {
            $table->id();
            $table->integer('academic_org');
            $table->integer('term_code');
            $table->decimal('hourly_rate', 10, 2)->nullable();
            $table->decimal('health_rate', 6, 4)->nullable();
            $table->decimal('tuition_per_hour_regular', 10, 2)->nullable();
            $table->decimal('tuition_per_hour_abd', 10, 2)->nullable();
            $table->decimal('fee_offset', 10, 2)->nullable();
            $table->decimal('international_offset', 10, 2)->nullable();
            $table->decimal('per_credit_payment', 10, 2)->nullable();
            $table->decimal('default_appointment_percent', 5, 2)->nullable();
            $this->addAuditColumns($table);

            $table->unique(['academic_org', 'term_code'], 'term_grad_rate_overrides_unique');
        });

        Schema::create('term_job_code_rate_overrides', function (Blueprint $table) {
            $table->id();
            $table->integer('academic_org');
            $table->integer('term_code');
            $table->string('job_code', 16);
            $table->decimal('salary', 10, 2)->nullable();
            $table->decimal('fringe_rate', 6, 4)->nullable();
            $this->addAuditColumns($table);

            $table->unique(['academic_org', 'term_code', 'job_code'], 'term_job_code_rate_overrides_unique');
        });
    }

    private function addAuditColumns(Blueprint $table): void {
        $table->unsignedInteger('created_by')->nullable();
        $table->unsignedInteger('updated_by')->nullable();
        $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
        $table->foreign('updated_by')->references('id')->on('users')->nullOnDelete();
        $table->timestamps();
    }
};
