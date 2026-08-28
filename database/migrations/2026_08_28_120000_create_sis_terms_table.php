<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('sis_terms', function (Blueprint $table) {
            $table->id();
            $table->integer('term_code')->index();
            $table->string('institution');
            $table->string('academic_career');
            $table->string('description');
            $table->date('begins_on');
            $table->date('ends_on');
            $table->timestamps();

            // the same term code repeats across campuses and careers with different dates
            $table->unique(['term_code', 'institution', 'academic_career']);
        });
    }

    public function down(): void {
        Schema::dropIfExists('sis_terms');
    }
};
