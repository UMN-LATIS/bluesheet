<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('sis_class_sections', function (Blueprint $table) {
            // subject and catalog number joined, so reaching sis_courses is a
            // one-column join and the table reads plainly by hand
            $table->string('course_code')->after('catalog_number')->index();
        });

        // the nightly import writes this column from now on; existing rows are
        // filled here so the mirror is usable before the next run
        DB::table('sis_class_sections')->update([
            'course_code' => DB::raw("CONCAT(subject, '-', catalog_number)"),
        ]);
    }

    public function down(): void {
        Schema::table('sis_class_sections', function (Blueprint $table) {
            $table->dropIndex(['course_code']);
            $table->dropColumn('course_code');
        });
    }
};
