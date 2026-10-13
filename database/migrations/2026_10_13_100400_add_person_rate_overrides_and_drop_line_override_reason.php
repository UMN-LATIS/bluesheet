<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('term_person_rate_overrides', function (Blueprint $table) {
            $table->id();
            $table->integer('academic_org');
            $table->integer('term_code');
            $table->integer('emplid');
            $table->decimal('amount', 10, 2);

            $table->unsignedInteger('created_by')->nullable();
            $table->unsignedInteger('updated_by')->nullable();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('updated_by')->references('id')->on('users')->nullOnDelete();

            $table->timestamps();

            $table->unique(['academic_org', 'term_code', 'emplid'], 'term_person_rate_overrides_unique');
        });

        Schema::table('term_cost_line_overrides', function (Blueprint $table) {
            $table->dropColumn('reason');
        });
    }

    public function down(): void {
        Schema::table('term_cost_line_overrides', function (Blueprint $table) {
            $table->text('reason')->nullable()->after('amount');
        });

        Schema::dropIfExists('term_person_rate_overrides');
    }
};
