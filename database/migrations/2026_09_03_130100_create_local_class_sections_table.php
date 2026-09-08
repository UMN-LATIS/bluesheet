<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A section a scheduler planned for a term the SIS has not published.
 *
 * Not an overlay: a term is either the SIS's or the schedulers', never both,
 * so a row here never shadows a sis_class_sections row. It holds what a
 * scheduler can set and nothing the SIS observes, which is why the enrollment
 * and waitlist totals on the mirror's section table have no counterpart here.
 */
return new class extends Migration {
    public function up(): void {
        Schema::create('local_class_sections', function (Blueprint $table) {
            $table->id();

            $table->integer('term_code');
            $table->integer('academic_org');

            $table->string('course_code');
            $table->string('subject');
            $table->string('catalog_number');
            $table->string('class_section');
            $table->string('component');
            $table->string('title');
            $table->integer('credits')->nullable();
            $table->integer('enrollment_cap')->default(0);

            // neither has a column in the SIS: see the front end's Delivery type
            $table->string('delivery')->default('onCampus');
            $table->text('notes')->nullable();

            $table->boolean('is_cancelled')->default(false);

            $table->unsignedInteger('created_by')->nullable();
            $table->unsignedInteger('updated_by')->nullable();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('updated_by')->references('id')->on('users')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['academic_org', 'term_code']);

            // the LMS-style key: one section number per course per term. Verified
            // against 6206 mirrored sections across 17 terms with no collision.
            // deleted_at is in the key so a deleted section number can be reused.
            $table->unique(
                ['term_code', 'course_code', 'class_section', 'deleted_at'],
                'local_class_sections_unique'
            );
        });
    }

    public function down(): void {
        Schema::dropIfExists('local_class_sections');
    }
};
