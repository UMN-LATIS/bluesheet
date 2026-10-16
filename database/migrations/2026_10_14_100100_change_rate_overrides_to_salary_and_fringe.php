<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('term_job_code_rate_overrides', function (Blueprint $table) {
            $table->dropColumn('cost_per_course');
        });

        Schema::table('term_job_code_rate_overrides', function (Blueprint $table) {
            $table->decimal('salary', 10, 2)->nullable()->after('job_code');
            $table->decimal('fringe_rate', 6, 4)->nullable()->after('salary');
        });

        Schema::table('term_person_rate_overrides', function (Blueprint $table) {
            $table->renameColumn('amount', 'salary');
        });
    }

    public function down(): void {
        Schema::table('term_person_rate_overrides', function (Blueprint $table) {
            $table->renameColumn('salary', 'amount');
        });

        Schema::table('term_job_code_rate_overrides', function (Blueprint $table) {
            $table->dropColumn(['salary', 'fringe_rate']);
        });

        Schema::table('term_job_code_rate_overrides', function (Blueprint $table) {
            $table->decimal('cost_per_course', 10, 2)->default(0)->after('job_code');
        });
    }
};
