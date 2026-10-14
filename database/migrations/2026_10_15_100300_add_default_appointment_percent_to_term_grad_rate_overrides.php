<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('term_grad_rate_overrides', function (Blueprint $table) {
            $table->decimal('default_appointment_percent', 5, 2)->nullable()->after('per_credit_payment');
        });
    }

    public function down(): void {
        Schema::table('term_grad_rate_overrides', function (Blueprint $table) {
            $table->dropColumn('default_appointment_percent');
        });
    }
};
