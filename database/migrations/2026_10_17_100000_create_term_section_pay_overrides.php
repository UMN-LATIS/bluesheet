<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('term_section_pay_overrides', function (Blueprint $table) {
            $table->id();
            $table->integer('academic_org');
            $table->integer('term_code');
            $table->string('course_code');
            $table->string('class_section');
            $table->integer('emplid');
            $table->decimal('salary', 10, 2)->nullable();
            $table->decimal('fringe_rate', 6, 4)->nullable();
            $table->decimal('appointment_percent', 5, 2)->nullable();

            $table->unsignedInteger('created_by')->nullable();
            $table->unsignedInteger('updated_by')->nullable();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('updated_by')->references('id')->on('users')->nullOnDelete();

            $table->timestamps();

            $table->unique(['academic_org', 'term_code', 'course_code', 'class_section', 'emplid'], 'term_section_pay_overrides_unique');
        });

        $now = now();
        $rows = DB::table('local_class_instructors')
            ->join('local_class_sections', 'local_class_sections.id', '=', 'local_class_instructors.local_class_section_id')
            ->whereNotNull('local_class_instructors.appointment_percent')
            ->get([
                'local_class_sections.academic_org',
                'local_class_sections.term_code',
                'local_class_sections.course_code',
                'local_class_sections.class_section',
                'local_class_instructors.emplid',
                'local_class_instructors.appointment_percent',
            ])
            ->map(fn(object $row) => [...(array) $row, 'created_at' => $now, 'updated_at' => $now]);

        foreach ($rows->chunk(500) as $chunk) {
            DB::table('term_section_pay_overrides')->insertOrIgnore($chunk->all());
        }

        Schema::table('local_class_instructors', function (Blueprint $table) {
            $table->dropColumn('appointment_percent');
        });
    }

    public function down(): void {
        Schema::table('local_class_instructors', function (Blueprint $table) {
            $table->decimal('appointment_percent', 5, 2)->nullable()->after('role');
        });

        DB::table('term_section_pay_overrides')
            ->whereNotNull('appointment_percent')
            ->get()
            ->each(function (object $override) {
                DB::table('local_class_instructors')
                    ->where('emplid', $override->emplid)
                    ->whereIn('local_class_section_id', DB::table('local_class_sections')
                        ->where('academic_org', $override->academic_org)
                        ->where('term_code', $override->term_code)
                        ->where('course_code', $override->course_code)
                        ->where('class_section', $override->class_section)
                        ->select('id'))
                    ->update(['appointment_percent' => $override->appointment_percent]);
            });

        Schema::dropIfExists('term_section_pay_overrides');
    }
};
