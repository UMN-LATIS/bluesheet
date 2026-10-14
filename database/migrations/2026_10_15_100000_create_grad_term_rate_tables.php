<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('grad_term_rates', function (Blueprint $table) {
            $table->id();
            $table->integer('term_code')->unique();
            $table->decimal('hourly_rate', 10, 2);
            $table->decimal('health_rate', 6, 4);
            $table->decimal('tuition_per_hour_regular', 10, 2);
            $table->decimal('tuition_per_hour_abd', 10, 2);
            $table->decimal('fee_offset', 10, 2);
            $table->decimal('international_offset', 10, 2);
            $table->decimal('per_credit_payment', 10, 2);
            $table->string('source')->nullable();
            $table->timestamps();
        });

        Schema::create('grad_appointment_levels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('grad_term_rate_id')->constrained('grad_term_rates')->cascadeOnDelete();
            $table->decimal('appointment_percent', 5, 2);
            $table->unsignedSmallInteger('hours');
            $table->timestamps();

            $table->unique(['grad_term_rate_id', 'appointment_percent'], 'grad_appointment_levels_unique');
        });
    }

    public function down(): void {
        Schema::dropIfExists('grad_appointment_levels');
        Schema::dropIfExists('grad_term_rates');
    }
};
