<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('sis_departments', function (Blueprint $table) {
            $table->id();
            $table->string('dept_id')->unique();
            $table->string('description');
            $table->string('college')->nullable();
            $table->string('college_description')->nullable();
            $table->string('zdept_id')->nullable();
            $table->string('campus')->nullable();
            $table->string('campus_description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('sis_departments');
    }
};
