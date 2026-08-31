<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('sis_class_meetings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sis_class_section_id')->constrained();

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
        Schema::dropIfExists('sis_class_meetings');
    }
};
