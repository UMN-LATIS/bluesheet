<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up() {
        Schema::create('enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_section_id')
                ->references('id')
                ->on('course_sections')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
            $table->unsignedInteger('user_id')
                ->references('id')
                ->on('users')
                ->cascadeOnUpdate()
                ->nullOnDelete();
            $table->string('role'); // "PI", "TA"
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down() {
        Schema::dropIfExists('enrollments');
    }
};
