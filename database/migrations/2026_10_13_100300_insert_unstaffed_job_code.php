<?php

use App\JobCode;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void {
        DB::table('job_codes')->insertOrIgnore([
            'code' => JobCode::UNSTAFFED_CODE,
            'title' => 'Unstaffed',
            'instructor_type' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void {
        DB::table('job_codes')
            ->where('code', JobCode::UNSTAFFED_CODE)
            ->whereNotExists(fn($rates) => $rates
                ->from('job_code_rates')
                ->whereColumn('job_code_rates.job_code_id', 'job_codes.id'))
            ->delete();
    }
};
