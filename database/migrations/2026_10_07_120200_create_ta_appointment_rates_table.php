<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('ta_appointment_rates', function (Blueprint $table) {
            $table->id();
            $table->unsignedSmallInteger('fiscal_year');
            $table->string('season');
            $table->string('student_status');
            $table->decimal('appointment_percent', 5, 2);
            $table->decimal('cost_per_term', 10, 2);
            $table->string('source')->nullable();
            $table->timestamps();

            // The generated name is 69 characters.
            // MySQL refuses index names over 64.
            $table->unique(
                ['fiscal_year', 'season', 'student_status', 'appointment_percent'],
                'ta_appointment_rates_unique'
            );
        });
    }

    public function down(): void {
        Schema::dropIfExists('ta_appointment_rates');
    }
};
