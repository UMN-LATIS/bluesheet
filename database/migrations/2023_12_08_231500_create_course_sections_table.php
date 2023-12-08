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
        Schema::create('course_sections', function (Blueprint $table) {
            $table->id();

            // used to make foreign key to course
            // course info is in Bandaid, so not a "real"
            // foreign key
            $table->string('course_id'); // "HIST-1001W"

            // foreign key for term
            $table->unsignedInteger('term_id');

            // old style foreign key to groups table
            $table->unsignedInteger('group_id');
            $table->foreign('group_id')->references('id')->on('groups')->cascadeOnUpdate()->cascadeOnDelete();

            $table->string('class_section')->default('TBD');
            $table->boolean('is_published')->default(false);
            $table->boolean('is_cancelled')->default(false);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down() {
        Schema::dropIfExists('course_sections');
    }
};
