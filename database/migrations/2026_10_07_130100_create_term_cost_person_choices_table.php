<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('term_cost_person_choices', function (Blueprint $table) {
            $table->id();
            $table->integer('academic_org');
            $table->integer('term_code');
            $table->integer('emplid');

            $table->string('job_code')->nullable();
            $table->string('instructor_type')->nullable();
            $table->string('student_status')->nullable();
            $table->decimal('override_cost', 10, 2)->nullable();
            $table->text('override_reason')->nullable();

            $table->unsignedInteger('created_by')->nullable();
            $table->unsignedInteger('updated_by')->nullable();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('updated_by')->references('id')->on('users')->nullOnDelete();

            $table->timestamps();

            $table->unique(['academic_org', 'term_code', 'emplid']);
        });
    }

    public function down(): void {
        Schema::dropIfExists('term_cost_person_choices');
    }
};
