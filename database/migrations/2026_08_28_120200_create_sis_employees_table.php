<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('sis_employees', function (Blueprint $table) {
            $table->id();

            // unique() also creates the index every lookup uses
            $table->integer('emplid')->unique();

            $table->string('full_name')->nullable();
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('internet_id')->nullable()->index();
            $table->string('umndid')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('sis_employees');
    }
};
