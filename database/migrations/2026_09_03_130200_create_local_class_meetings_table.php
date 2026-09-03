<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** The same columns as sis_class_meetings, so both render through one shape. */
return new class extends Migration {
    public function up(): void {
        Schema::create('local_class_meetings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('local_class_section_id')->constrained()->cascadeOnDelete();

            $table->time('starts_at')->nullable();
            $table->time('ends_at')->nullable();
            $table->boolean('meets_monday')->default(false);
            $table->boolean('meets_tuesday')->default(false);
            $table->boolean('meets_wednesday')->default(false);
            $table->boolean('meets_thursday')->default(false);
            $table->boolean('meets_friday')->default(false);
            $table->boolean('meets_saturday')->default(false);
            $table->boolean('meets_sunday')->default(false);

            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('local_class_meetings');
    }
};
