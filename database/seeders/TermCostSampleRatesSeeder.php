<?php

namespace Database\Seeders;

use App\GradAppointmentLevel;
use App\GradTermRate;
use App\JobCode;
use App\JobCodeTermRate;
use App\Library\TermPlan\InstructorType;
use App\Library\TermPlan\StudentStatus;
use Illuminate\Database\Seeder;

class TermCostSampleRatesSeeder extends Seeder {
    private const TERM_CODES = [1269, 1273, 1279, 1283];

    private const FALL_SEASON_DIGIT = 9;

    private const PLACEHOLDER_SOURCE = 'Placeholder: $10k per course';

    private const GRAD_SOURCE = 'FY27 Grad Salary & Fringe Calculator';

    private const PLACEHOLDER_SALARY = 10000;

    private const INSTRUCTOR_FRINGE_RATE = 0.385;

    private const GRAD_INPUTS = [
        'hourly_rate' => 29.95,
        'health_rate' => 0.289,
        'tuition_per_hour_regular' => 25.08,
        'tuition_per_hour_abd' => 3.98,
        'fee_offset' => 235,
        'international_offset' => 280,
        'per_credit_payment' => 250,
    ];

    private const GRAD_APPOINTMENT_PERCENTS = [12.5, 25, 37.5, 50, 75];

    private const GRAD_FALL_HOURS = [98, 196, 294, 392, 588];

    private const GRAD_SPRING_HOURS = [97, 194, 291, 388, 582];

    private const INSTRUCTOR_CODES = [
        ['code' => '9401', 'title' => 'Professor', 'instructor_type' => InstructorType::RecurringBudgetFaculty, 'annual_load' => 4, 'fringe_rate' => 0],
        ['code' => '9402', 'title' => 'Associate Professor', 'instructor_type' => InstructorType::RecurringBudgetFaculty, 'annual_load' => 4, 'fringe_rate' => 0],
        ['code' => '9403', 'title' => 'Assistant Professor', 'instructor_type' => InstructorType::RecurringBudgetFaculty, 'annual_load' => 4, 'fringe_rate' => 0],
        ['code' => '9753', 'title' => 'Lecturer', 'instructor_type' => InstructorType::PaInstructor, 'annual_load' => 6],
        ['code' => '9754', 'title' => 'Teaching Specialist', 'instructor_type' => InstructorType::PaInstructor, 'annual_load' => 6],
        ['code' => '9404', 'title' => 'Instructor (temporary)', 'instructor_type' => InstructorType::ContractVisiting, 'annual_load' => 2],
        ['code' => JobCode::UNSTAFFED_CODE, 'title' => 'Unstaffed', 'instructor_type' => null, 'annual_load' => null],
    ];

    private const GRAD_CODES = [
        ['code' => '9515', 'title' => 'Graduate Instructor', 'instructor_type' => InstructorType::GraduateInstructor, 'annual_load' => 2, 'student_status' => StudentStatus::Regular],
        ['code' => '9517', 'title' => 'Ph D Candidate Grad Instr', 'instructor_type' => InstructorType::GraduateInstructor, 'annual_load' => 2, 'student_status' => StudentStatus::Abd],
        ['code' => '9511', 'title' => 'Teaching Assistant', 'instructor_type' => InstructorType::TeachingAssistant, 'annual_load' => 2, 'student_status' => StudentStatus::Regular],
        ['code' => '9519', 'title' => 'PhD Candidate Teaching Asst', 'instructor_type' => InstructorType::TeachingAssistant, 'annual_load' => 2, 'student_status' => StudentStatus::Abd],
    ];

    public function run(): void {
        foreach (self::INSTRUCTOR_CODES as $row) {
            $jobCode = $this->updateOrCreateJobCode($row);
            $isRecurring = array_key_exists('fringe_rate', $row);

            foreach (self::TERM_CODES as $termCode) {
                $this->updateOrCreateTermRate(
                    $jobCode,
                    $termCode,
                    $isRecurring ? 0 : self::PLACEHOLDER_SALARY,
                    $row['fringe_rate'] ?? self::INSTRUCTOR_FRINGE_RATE,
                    self::PLACEHOLDER_SOURCE,
                );
            }
        }

        foreach (self::GRAD_CODES as $row) {
            $this->updateOrCreateJobCode($row);
        }

        foreach (self::TERM_CODES as $termCode) {
            $this->updateOrCreateGradTermRate($termCode);
        }
    }

    private function updateOrCreateGradTermRate(int $termCode): void {
        $gradTermRate = GradTermRate::updateOrCreate(
            ['term_code' => $termCode],
            [...self::GRAD_INPUTS, 'source' => self::GRAD_SOURCE],
        );
        $isFall = $termCode % 10 === self::FALL_SEASON_DIGIT;

        $hoursByLevel = $isFall ? self::GRAD_FALL_HOURS : self::GRAD_SPRING_HOURS;

        foreach (self::GRAD_APPOINTMENT_PERCENTS as $index => $appointmentPercent) {
            GradAppointmentLevel::updateOrCreate(
                ['grad_term_rate_id' => $gradTermRate->id, 'appointment_percent' => $appointmentPercent],
                ['hours' => $hoursByLevel[$index]],
            );
        }
    }

    private function updateOrCreateJobCode(array $row): JobCode {
        return JobCode::updateOrCreate(
            ['code' => $row['code']],
            [
                'title' => $row['title'],
                'instructor_type' => $row['instructor_type'],
                'annual_load' => $row['annual_load'],
                'student_status' => $row['student_status'] ?? null,
            ],
        );
    }

    private function updateOrCreateTermRate(JobCode $jobCode, int $termCode, float $salary, float $fringeRate, string $source): void {
        JobCodeTermRate::updateOrCreate(
            ['job_code_id' => $jobCode->id, 'term_code' => $termCode],
            ['salary' => $salary, 'fringe_rate' => $fringeRate, 'source' => $source],
        );
    }
}
