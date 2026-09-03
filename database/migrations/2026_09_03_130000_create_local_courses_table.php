<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A course a scheduler named that the SIS has not published. Deliberately not
 * a foreign key into the sis_ mirror: those tables are dropped and recreated
 * every night, so anything pointing into them by row id would survive the
 * rename attached to an unrelated course.
 */
return new class extends Migration {
    public function up(): void {
        Schema::create('local_courses', function (Blueprint $table) {
            $table->id();

            $table->string('course_code');
            $table->string('subject');
            $table->string('catalog_number');
            $table->string('title');
            $table->integer('credits')->nullable();

            $table->integer('academic_org')->index();

            $table->unsignedInteger('created_by')->nullable();
            $table->unsignedInteger('updated_by')->nullable();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('updated_by')->references('id')->on('users')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();

            // deleted_at is part of the key so that deleting a course and
            // naming it again is an ordinary thing to do. MySQL treats nulls
            // in a unique key as distinct, so live rows still collide.
            $table->unique(['academic_org', 'course_code', 'deleted_at'], 'local_courses_unique');
        });
    }

    public function down(): void {
        Schema::dropIfExists('local_courses');
    }
};
