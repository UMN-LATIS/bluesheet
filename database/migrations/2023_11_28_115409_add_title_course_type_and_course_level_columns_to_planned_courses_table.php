<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up() {
        Schema::table('planned_courses', function (Blueprint $table) {
            $table->text('title')->after('catalog_number');
            $table->text('course_type')->after('title');
            $table->text('course_level')->after('course_type');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down() {
        Schema::table('planned_courses', function (Blueprint $table) {
            $table->dropColumn('title');
            $table->dropColumn('course_type');
            $table->dropColumn('course_level');
        });
    }
};
