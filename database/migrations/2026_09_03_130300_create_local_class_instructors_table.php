<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('local_class_instructors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('local_class_section_id')->constrained()->cascadeOnDelete();

            // no foreign key to sis_employees on purpose: that table is dropped
            // and recreated every night, and a constraint into it would be
            // rebuilt pointing at the wrong side of the swap
            $table->integer('emplid');

            $table->string('role');
            $table->timestamps();

            $table->unique(['local_class_section_id', 'emplid', 'role'], 'local_class_instructors_unique');
        });
    }

    public function down(): void {
        Schema::dropIfExists('local_class_instructors');
    }
};
