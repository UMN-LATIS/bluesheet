<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('term_person_notes', function (Blueprint $table) {
            $table->id();
            $table->integer('academic_org');
            $table->integer('term_code');
            $table->integer('emplid');
            $table->text('notes');

            $table->unsignedInteger('created_by')->nullable();
            $table->unsignedInteger('updated_by')->nullable();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('updated_by')->references('id')->on('users')->nullOnDelete();

            $table->timestamps();

            $table->unique(['academic_org', 'term_code', 'emplid'], 'term_person_notes_unique');
        });
    }

    public function down(): void {
        Schema::dropIfExists('term_person_notes');
    }
};
