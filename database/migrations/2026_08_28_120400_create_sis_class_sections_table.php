<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('sis_class_sections', function (Blueprint $table) {
            $table->id();

            // Bandaid returns one row per class per instructor per meeting
            // pattern. Sections are stored once here, with instructors and
            // meetings split into their own tables.
            $table->integer('term_code');
            $table->integer('class_number');

            $table->integer('academic_org')->index();
            $table->string('institution');
            $table->string('subject');
            $table->string('catalog_number');
            $table->string('class_section');
            $table->string('component');
            $table->string('academic_career');
            $table->string('title');
            $table->integer('credits')->nullable();
            $table->integer('enrollment_cap')->default(0);
            $table->integer('enrollment_total')->default(0);
            $table->integer('waitlist_cap')->default(0);
            $table->integer('waitlist_total')->default(0);
            $table->boolean('is_cancelled')->default(false);

            // slash-delimited ("AFRO 4406-001/GWSS 4406-001"), stored unparsed
            // TODO: consider normalizing into a separate table
            $table->string('crosslist')->nullable();

            $table->timestamps();

            $table->unique(['term_code', 'class_number']);
            $table->index(['academic_org', 'term_code']);
        });
    }

    public function down(): void {
        Schema::dropIfExists('sis_class_sections');
    }
};
