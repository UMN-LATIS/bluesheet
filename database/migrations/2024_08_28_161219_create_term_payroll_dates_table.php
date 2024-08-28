<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('term_payroll_dates', function (Blueprint $table) {
            $table->id();
            $table->integer('term_code')->unique();
            $table->integer('year');
            $table->string('semester');
            $table->date('payroll_start_date');
            $table->date('payroll_end_date');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('term_payroll_dates');
    }
};
