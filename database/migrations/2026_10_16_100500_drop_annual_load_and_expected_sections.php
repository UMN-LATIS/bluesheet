<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('job_codes', function (Blueprint $table) {
            $table->dropColumn('annual_load');
        });

        Schema::table('term_person_inputs', function (Blueprint $table) {
            $table->dropColumn('expected_sections');
        });
    }

    public function down(): void {
        Schema::table('job_codes', function (Blueprint $table) {
            $table->unsignedTinyInteger('annual_load')->nullable()->after('instructor_type');
        });

        Schema::table('term_person_inputs', function (Blueprint $table) {
            $table->unsignedTinyInteger('expected_sections')->nullable()->after('release_source');
        });
    }
};
