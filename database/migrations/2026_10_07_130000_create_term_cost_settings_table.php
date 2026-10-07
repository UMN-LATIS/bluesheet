<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('term_cost_settings', function (Blueprint $table) {
            $table->id();
            $table->integer('academic_org');
            $table->unsignedSmallInteger('fiscal_year');
            $table->string('key');
            $table->decimal('value', 10, 2);

            $table->unsignedInteger('created_by')->nullable();
            $table->unsignedInteger('updated_by')->nullable();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('updated_by')->references('id')->on('users')->nullOnDelete();

            $table->timestamps();

            $table->unique(['academic_org', 'key', 'fiscal_year']);
        });
    }

    public function down(): void {
        Schema::dropIfExists('term_cost_settings');
    }
};
