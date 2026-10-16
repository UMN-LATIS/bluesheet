<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('term_grad_people', function (Blueprint $table) {
            $table->dropColumn('appointment_percent');
        });
    }

    public function down(): void {
        Schema::table('term_grad_people', function (Blueprint $table) {
            $table->decimal('appointment_percent', 5, 2)->nullable()->after('emplid');
        });
    }
};
