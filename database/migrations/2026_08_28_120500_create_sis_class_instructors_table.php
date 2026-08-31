<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('sis_class_instructors', function (Blueprint $table) {
            $table->id();
            // plain column, no FK: MySQL foreign keys follow a table through
            // RENAME, so after the importer's swap an FK here would still
            // point at the displaced _old table
            $table->unsignedBigInteger('sis_class_section_id');

            $table->integer('emplid')->index();
            $table->string('role');
            $table->timestamps();

            $table->unique(['sis_class_section_id', 'emplid', 'role'], 'sis_class_instructors_unique');
        });
    }

    public function down(): void {
        Schema::dropIfExists('sis_class_instructors');
    }
};
