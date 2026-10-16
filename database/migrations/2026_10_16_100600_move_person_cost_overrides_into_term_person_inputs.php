<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('term_person_inputs', function (Blueprint $table) {
            $table->decimal('salary', 10, 2)->nullable()->after('release_source');
            $table->decimal('fringe_rate', 6, 4)->nullable()->after('salary');
            $table->decimal('hourly_rate', 10, 2)->nullable()->after('fringe_rate');
            $table->unsignedSmallInteger('hours')->nullable()->after('hourly_rate');
            $table->decimal('health_rate', 6, 4)->nullable()->after('hours');
            $table->decimal('tuition_per_hour', 10, 2)->nullable()->after('health_rate');
            $table->decimal('fee_offset', 10, 2)->nullable()->after('tuition_per_hour');
            $table->decimal('international_offset', 10, 2)->nullable()->after('fee_offset');
            $table->decimal('per_credit_payment', 10, 2)->nullable()->after('international_offset');
            $table->unsignedTinyInteger('credits_taught')->nullable()->after('per_credit_payment');
        });

        $this->copySalariesIntoPersonInputs();

        Schema::dropIfExists('term_person_rate_overrides');
    }

    public function down(): void {
        Schema::create('term_person_rate_overrides', function (Blueprint $table) {
            $table->id();
            $table->integer('academic_org');
            $table->integer('term_code');
            $table->integer('emplid');
            $table->decimal('salary', 10, 2);

            $table->unsignedInteger('created_by')->nullable();
            $table->unsignedInteger('updated_by')->nullable();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('updated_by')->references('id')->on('users')->nullOnDelete();

            $table->timestamps();

            $table->unique(['academic_org', 'term_code', 'emplid'], 'term_person_rate_overrides_unique');
        });

        $this->copySalariesBackIntoRateOverrides();

        Schema::table('term_person_inputs', function (Blueprint $table) {
            $table->dropColumn([
                'salary',
                'fringe_rate',
                'hourly_rate',
                'hours',
                'health_rate',
                'tuition_per_hour',
                'fee_offset',
                'international_offset',
                'per_credit_payment',
                'credits_taught',
            ]);
        });

        DB::table('term_person_inputs')
            ->whereNull('notes')
            ->whereNull('year_started')
            ->whereNull('course_releases')
            ->whereNull('release_source')
            ->delete();
    }

    private function copySalariesIntoPersonInputs(): void {
        foreach (DB::table('term_person_rate_overrides')->get() as $override) {
            $personKey = [
                'academic_org' => $override->academic_org,
                'term_code' => $override->term_code,
                'emplid' => $override->emplid,
            ];

            $hasPersonInputs = DB::table('term_person_inputs')->where($personKey)->exists();

            if ($hasPersonInputs) {
                DB::table('term_person_inputs')->where($personKey)->update(['salary' => $override->salary]);

                continue;
            }

            DB::table('term_person_inputs')->insert([
                ...$personKey,
                'salary' => $override->salary,
                'created_by' => $override->created_by,
                'updated_by' => $override->updated_by,
                'created_at' => $override->created_at,
                'updated_at' => $override->updated_at,
            ]);
        }
    }

    private function copySalariesBackIntoRateOverrides(): void {
        $inputsWithSalary = DB::table('term_person_inputs')->whereNotNull('salary')->get();

        foreach ($inputsWithSalary as $input) {
            DB::table('term_person_rate_overrides')->insert([
                'academic_org' => $input->academic_org,
                'term_code' => $input->term_code,
                'emplid' => $input->emplid,
                'salary' => $input->salary,
                'created_by' => $input->created_by,
                'updated_by' => $input->updated_by,
                'created_at' => $input->created_at,
                'updated_at' => $input->updated_at,
            ]);
        }
    }
};
