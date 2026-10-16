<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    private const TERM_CODES = [1269, 1273];

    private const SPRING_TERM_CODE = 1273;

    private const UNSTAFFED_CODE = 'TBA';

    private const PLACEHOLDER_SOURCE = 'FY27 planning spreadsheet: $10,000 per section; 38.5% fringe is a placeholder';

    private const RECURRING_SOURCE = 'Recurring budget: no cost to the department';

    private const GRAD_SOURCE = 'FY27 Grad Salary & Fringe Calculator';

    private const PLACEHOLDER_RATE = ['salary' => 10000, 'fringe_rate' => 0.385, 'source' => self::PLACEHOLDER_SOURCE];

    private const RECURRING_RATE = ['salary' => 0, 'fringe_rate' => 0, 'source' => self::RECURRING_SOURCE];

    private const RECURRING = 'recurring_budget_faculty';

    private const PA = 'pa_instructor';

    private const CONTRACT = 'contract_visiting';

    private const TA = 'teaching_assistant';

    private const GI = 'graduate_instructor';

    private const JOB_CODES = [
        ['code' => '9401', 'title' => 'Professor', 'instructor_type' => self::RECURRING, 'rate' => self::RECURRING_RATE],
        ['code' => '9402', 'title' => 'Associate Professor', 'instructor_type' => self::RECURRING, 'rate' => self::RECURRING_RATE],
        ['code' => '9403', 'title' => 'Assistant Professor', 'instructor_type' => self::RECURRING, 'rate' => self::RECURRING_RATE],
        ['code' => '9410', 'title' => 'Regents Professor', 'instructor_type' => self::RECURRING, 'rate' => self::RECURRING_RATE],
        ['code' => '9360', 'title' => 'Chair (With Faculty Rank)', 'instructor_type' => self::RECURRING, 'rate' => self::RECURRING_RATE],
        ['code' => '9361', 'title' => 'Head (With Faculty Rank)', 'instructor_type' => self::RECURRING, 'rate' => self::RECURRING_RATE],
        ['code' => '9362', 'title' => 'Director (With Faculty Rank)', 'instructor_type' => self::RECURRING, 'rate' => self::RECURRING_RATE],
        ['code' => '9340FR', 'title' => 'Leader (With Faculty Rank)', 'instructor_type' => self::RECURRING, 'rate' => self::RECURRING_RATE],

        ['code' => '9753', 'title' => 'Lecturer', 'instructor_type' => self::PA, 'rate' => self::PLACEHOLDER_RATE],
        ['code' => '9753I', 'title' => 'Lecturer', 'instructor_type' => self::PA, 'rate' => self::PLACEHOLDER_RATE],
        ['code' => '9753T', 'title' => 'Lecturer/Assistant Professor', 'instructor_type' => self::PA, 'rate' => self::PLACEHOLDER_RATE],
        ['code' => '9754', 'title' => 'Teaching Specialist', 'instructor_type' => self::PA, 'rate' => self::PLACEHOLDER_RATE],
        ['code' => '9754I', 'title' => 'Teaching Specialist', 'instructor_type' => self::PA, 'rate' => self::PLACEHOLDER_RATE],
        ['code' => '9770', 'title' => 'Senior Lecturer', 'instructor_type' => self::PA, 'rate' => self::PLACEHOLDER_RATE],
        ['code' => '9770I', 'title' => 'Senior Lecturer', 'instructor_type' => self::PA, 'rate' => self::PLACEHOLDER_RATE],
        ['code' => '9770P', 'title' => 'Senior Lecturer/Professor', 'instructor_type' => self::PA, 'rate' => self::PLACEHOLDER_RATE],
        ['code' => '9771', 'title' => 'Senior Teaching Specialist', 'instructor_type' => self::PA, 'rate' => self::PLACEHOLDER_RATE],
        ['code' => '9771I', 'title' => 'Senior Teaching Specialist', 'instructor_type' => self::PA, 'rate' => self::PLACEHOLDER_RATE],

        ['code' => '9404', 'title' => 'Instructor', 'instructor_type' => self::CONTRACT, 'rate' => self::PLACEHOLDER_RATE],
        ['code' => '9401C', 'title' => 'Clinical Professor', 'instructor_type' => self::CONTRACT, 'rate' => self::PLACEHOLDER_RATE],
        ['code' => '9402C', 'title' => 'Clinical Associate Professor', 'instructor_type' => self::CONTRACT, 'rate' => self::PLACEHOLDER_RATE],
        ['code' => '9403C', 'title' => 'Clinical Assistant Professor', 'instructor_type' => self::CONTRACT, 'rate' => self::PLACEHOLDER_RATE],
        ['code' => '9404C', 'title' => 'Clinical Instructor', 'instructor_type' => self::CONTRACT, 'rate' => self::PLACEHOLDER_RATE],
        ['code' => '9401R', 'title' => 'Research Professor', 'instructor_type' => self::CONTRACT, 'rate' => self::PLACEHOLDER_RATE],
        ['code' => '9402R', 'title' => 'Research Associate Professor', 'instructor_type' => self::CONTRACT, 'rate' => self::PLACEHOLDER_RATE],
        ['code' => '9403R', 'title' => 'Research Assistant Professor', 'instructor_type' => self::CONTRACT, 'rate' => self::PLACEHOLDER_RATE],
        ['code' => '9404R', 'title' => 'Research Instructor', 'instructor_type' => self::CONTRACT, 'rate' => self::PLACEHOLDER_RATE],
        ['code' => '9401T', 'title' => 'Teaching Professor', 'instructor_type' => self::CONTRACT, 'rate' => self::PLACEHOLDER_RATE],
        ['code' => '9402T', 'title' => 'Teaching Associate Professor', 'instructor_type' => self::CONTRACT, 'rate' => self::PLACEHOLDER_RATE],
        ['code' => '9403T', 'title' => 'Teaching Assistant Professor', 'instructor_type' => self::CONTRACT, 'rate' => self::PLACEHOLDER_RATE],
        ['code' => '9404T', 'title' => 'Teaching Instructor', 'instructor_type' => self::CONTRACT, 'rate' => self::PLACEHOLDER_RATE],
        ['code' => '9401A', 'title' => 'Adjunct Professor', 'instructor_type' => self::CONTRACT, 'rate' => self::PLACEHOLDER_RATE],
        ['code' => '9402A', 'title' => 'Adjunct Associate Professor', 'instructor_type' => self::CONTRACT, 'rate' => self::PLACEHOLDER_RATE],
        ['code' => '9403A', 'title' => 'Adjunct Assistant Professor', 'instructor_type' => self::CONTRACT, 'rate' => self::PLACEHOLDER_RATE],
        ['code' => '9404A', 'title' => 'Adjunct Instructor', 'instructor_type' => self::CONTRACT, 'rate' => self::PLACEHOLDER_RATE],
        ['code' => '9401V', 'title' => 'Visiting Professor', 'instructor_type' => self::CONTRACT, 'rate' => self::PLACEHOLDER_RATE],
        ['code' => '9402V', 'title' => 'Visiting Associate Professor', 'instructor_type' => self::CONTRACT, 'rate' => self::PLACEHOLDER_RATE],
        ['code' => '9403V', 'title' => 'Visiting Assistant Professor', 'instructor_type' => self::CONTRACT, 'rate' => self::PLACEHOLDER_RATE],
        ['code' => '9404V', 'title' => 'Visiting Instructor', 'instructor_type' => self::CONTRACT, 'rate' => self::PLACEHOLDER_RATE],
        ['code' => '9546', 'title' => 'Post-Doctoral Associate', 'instructor_type' => self::CONTRACT, 'rate' => self::PLACEHOLDER_RATE],
        ['code' => '9755', 'title' => 'Research Specialist', 'instructor_type' => self::CONTRACT, 'rate' => self::PLACEHOLDER_RATE],
        ['code' => '2221', 'title' => 'Undergrad Teaching Assistant', 'instructor_type' => self::CONTRACT, 'rate' => null],

        ['code' => '9511', 'title' => 'Teaching Assistant', 'instructor_type' => self::TA, 'student_status' => 'regular', 'rate' => null],
        ['code' => '9519', 'title' => 'PhD Candidate Teaching Asst', 'instructor_type' => self::TA, 'student_status' => 'abd', 'rate' => null],
        ['code' => '9521', 'title' => 'Research Assistant', 'instructor_type' => self::TA, 'student_status' => 'regular', 'rate' => null],
        ['code' => '9529', 'title' => 'PhD Candidate Research Asst', 'instructor_type' => self::TA, 'student_status' => 'abd', 'rate' => null],
        ['code' => '9561', 'title' => 'Graduate School Fellow', 'instructor_type' => self::TA, 'student_status' => 'regular', 'rate' => null],
        ['code' => '9562', 'title' => 'Graduate School Trainee', 'instructor_type' => self::TA, 'student_status' => 'regular', 'rate' => null],
        ['code' => '9515', 'title' => 'Graduate Instructor', 'instructor_type' => self::GI, 'student_status' => 'regular', 'rate' => null],
        ['code' => '9517', 'title' => 'Ph D Candidate Grad Instructor', 'instructor_type' => self::GI, 'student_status' => 'abd', 'rate' => null],
    ];

    private const GRAD_INPUTS = [
        'hourly_rate' => 29.95,
        'health_rate' => 0.289,
        'tuition_per_hour_regular' => 24.96,
        'tuition_per_hour_abd' => 3.96,
        'fee_offset' => 235,
        'international_offset' => 280,
        'per_credit_payment' => 250,
        'default_appointment_percent' => 25,
    ];

    private const FALL_HOURS_BY_APPOINTMENT = ['12.5' => 98, '25' => 196, '37.5' => 294, '50' => 392, '75' => 588];

    private const SPRING_HOURS_BY_APPOINTMENT = ['12.5' => 97, '25' => 194, '37.5' => 291, '50' => 388, '75' => 582];

    public function up(): void {
        $now = now();

        DB::table('job_codes')->insertOrIgnore(array_map(
            fn(array $jobCode) => [
                'code' => $jobCode['code'],
                'title' => $jobCode['title'],
                'instructor_type' => $jobCode['instructor_type'],
                'student_status' => $jobCode['student_status'] ?? null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            self::JOB_CODES,
        ));

        $rateByCode = [self::UNSTAFFED_CODE => self::PLACEHOLDER_RATE]
            + array_column(array_filter(self::JOB_CODES, fn(array $jobCode) => $jobCode['rate'] !== null), 'rate', 'code');
        $jobCodeIds = DB::table('job_codes')->whereIn('code', array_keys($rateByCode))->pluck('id', 'code');

        $termRates = [];
        foreach ($rateByCode as $code => $rate) {
            foreach (self::TERM_CODES as $termCode) {
                $termRates[] = ['job_code_id' => $jobCodeIds[$code], 'term_code' => $termCode, ...$rate, 'created_at' => $now, 'updated_at' => $now];
            }
        }
        DB::table('job_code_term_rates')->insertOrIgnore($termRates);

        foreach (self::TERM_CODES as $termCode) {
            $this->insertGradTermRate($termCode, $now);
        }
    }

    public function down(): void {
        DB::table('job_code_term_rates')
            ->whereIn('term_code', self::TERM_CODES)
            ->whereIn('source', [self::PLACEHOLDER_SOURCE, self::RECURRING_SOURCE])
            ->delete();

        DB::table('grad_term_rates')
            ->whereIn('term_code', self::TERM_CODES)
            ->where('source', self::GRAD_SOURCE)
            ->delete();

        DB::table('job_codes')
            ->whereIn('code', array_column(self::JOB_CODES, 'code'))
            ->whereNotExists(fn($rates) => $rates
                ->from('job_code_term_rates')
                ->whereColumn('job_code_term_rates.job_code_id', 'job_codes.id'))
            ->delete();
    }

    private function insertGradTermRate(int $termCode, Carbon $now): void {
        $isInserted = DB::table('grad_term_rates')->insertOrIgnore([
            'term_code' => $termCode,
            ...self::GRAD_INPUTS,
            'source' => self::GRAD_SOURCE,
            'created_at' => $now,
            'updated_at' => $now,
        ]) > 0;
        if (!$isInserted) return;

        $gradTermRateId = DB::table('grad_term_rates')->where('term_code', $termCode)->value('id');
        $hoursByAppointment = $termCode === self::SPRING_TERM_CODE
            ? self::SPRING_HOURS_BY_APPOINTMENT
            : self::FALL_HOURS_BY_APPOINTMENT;

        DB::table('grad_appointment_levels')->insertOrIgnore(array_map(
            fn(string $appointmentPercent, int $hours) => [
                'grad_term_rate_id' => $gradTermRateId,
                'appointment_percent' => (float) $appointmentPercent,
                'hours' => $hours,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            array_keys($hoursByAppointment),
            $hoursByAppointment,
        ));
    }
};
