<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::rename('term_person_notes', 'term_person_inputs');

        Schema::table('term_person_inputs', function (Blueprint $table) {
            $table->text('notes')->nullable()->change();
            $table->unsignedSmallInteger('year_started')->nullable()->after('notes');
            $table->unsignedTinyInteger('course_releases')->nullable()->after('year_started');
            $table->string('release_source', 255)->nullable()->after('course_releases');
            $table->unsignedTinyInteger('expected_sections')->nullable()->after('release_source');
        });
    }

    public function down(): void {
        Schema::table('term_person_inputs', function (Blueprint $table) {
            $table->dropColumn(['year_started', 'course_releases', 'release_source', 'expected_sections']);
        });

        DB::table('term_person_inputs')->whereNull('notes')->delete();

        Schema::table('term_person_inputs', function (Blueprint $table) {
            $table->text('notes')->nullable(false)->change();
        });

        Schema::rename('term_person_inputs', 'term_person_notes');
    }
};
