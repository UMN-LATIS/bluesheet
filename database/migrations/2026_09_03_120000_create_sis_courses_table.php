<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('sis_courses', function (Blueprint $table) {
            $table->id();

            // Bandaid has no course endpoint, so these rows are derived from
            // the class list: course-level facts ride on every section of
            // every offering, and the most recent offering wins.
            $table->string('course_code');
            $table->string('subject');
            $table->string('catalog_number');
            $table->string('title');
            $table->integer('credits')->nullable();
            $table->integer('last_offered_term_code');

            $table->integer('academic_org')->index();

            $table->timestamps();

            // Scoped to the department, not global. No course code in the
            // mirror spans two departments today, but a global unique key
            // would abort the whole nightly import the first time one did,
            // and a stale mirror is worse than a course stored twice.
            $table->unique(['academic_org', 'course_code']);
        });
    }

    public function down(): void {
        Schema::dropIfExists('sis_courses');
    }
};
