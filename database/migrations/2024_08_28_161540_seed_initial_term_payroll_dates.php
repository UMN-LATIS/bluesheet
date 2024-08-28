<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Seed initial term payroll dates
        DB::table('term_payroll_dates')->insert([
            [
                'term_code' => 1249,
                'semester' => 'Fall',
                'year' => 2024,
                'payroll_start_date' => '2024-08-26',
                'payroll_end_date' => '2025-01-08',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'term_code' => 1253,
                'semester' => 'Spring',
                'year' => 2025,
                'payroll_start_date' => '2025-01-09',
                'payroll_end_date' => '2025-05-25',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'term_code' => 1259,
                'semester' => 'Fall',
                'year' => 2025,
                'payroll_start_date' => '2025-08-25',
                'payroll_end_date' => '2026-01-07',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'term_code' => 1263,
                'semester' => 'Spring',
                'year' => 2026,
                'payroll_start_date' => '2026-01-08',
                'payroll_end_date' => '2026-05-24',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'term_code' => 1269,
                'semester' => 'Fall',
                'year' => 2026,
                'payroll_start_date' => '2026-08-31',
                'payroll_end_date' => '2027-01-13',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'term_code' => 1273,
                'semester' => 'Spring',
                'year' => 2027,
                'payroll_start_date' => '2027-01-14',
                'payroll_end_date' => '2027-05-30',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'term_code' => 1279,
                'semester' => 'Fall',
                'year' => 2027,
                'payroll_start_date' => '2027-08-30',
                'payroll_end_date' => '2028-01-12',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'term_code' => 1283,
                'semester' => 'Spring',
                'year' => 2028,
                'payroll_start_date' => '2028-01-13',
                'payroll_end_date' => '2028-05-28',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'term_code' => 1289,
                'semester' => 'Fall',
                'year' => 2028,
                'payroll_start_date' => '2028-08-28',
                'payroll_end_date' => '2029-01-10',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'term_code' => 1293,
                'semester' => 'Spring',
                'year' => 2029,
                'payroll_start_date' => '2029-01-11',
                'payroll_end_date' => '2029-05-27',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'term_code' => 1299,
                'semester' => 'Fall',
                'year' => 2029,
                'payroll_start_date' => '2029-08-27',
                'payroll_end_date' => '2030-01-09',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'term_code' => 1303,
                'semester' => 'Spring',
                'year' => 2030,
                'payroll_start_date' => '2030-01-10',
                'payroll_end_date' => '2030-05-26',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
