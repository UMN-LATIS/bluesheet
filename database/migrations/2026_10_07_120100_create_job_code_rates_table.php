<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('job_code_rates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_code_id')->constrained()->restrictOnDelete();
            $table->unsignedSmallInteger('fiscal_year');
            $table->decimal('cost_per_course', 10, 2);
            $table->string('source')->nullable();
            $table->timestamps();

            $table->unique(['job_code_id', 'fiscal_year']);
        });
    }

    public function down(): void {
        Schema::dropIfExists('job_code_rates');
    }
};
