<?php

namespace Database\Seeders;

use App\JobCode;
use App\JobCodeTermRate;
use App\Library\TermPlan\InstructorType;
use Illuminate\Database\Seeder;

class TermCostSampleRatesSeeder extends Seeder {
    private const TERM_CODES = [1269, 1273, 1279, 1283];

    private const FALL_SEASON_DIGIT = 9;

    private const PLACEHOLDER_SOURCE = 'Placeholder: $10k per course';

    private const GRAD_SOURCE = 'FY27 Grad Salary & Fringe Calculator';

    private const PLACEHOLDER_SALARY = 10000;

    private const INSTRUCTOR_FRINGE_RATE = 0.385;

    private const GRAD_REGULAR_FRINGE_RATE = 1.1264;

    private const GRAD_ABD_FRINGE_RATE = 0.4219;

    private const GRAD_FALL_SALARY = 5870.20;

    private const GRAD_SPRING_SALARY = 5810.30;

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
        ['code' => '9515', 'title' => 'Graduate Instructor', 'instructor_type' => InstructorType::GraduateInstructor, 'annual_load' => 2, 'fringe_rate' => self::GRAD_REGULAR_FRINGE_RATE],
        ['code' => '9517', 'title' => 'Ph D Candidate Grad Instr', 'instructor_type' => InstructorType::GraduateInstructor, 'annual_load' => 2, 'fringe_rate' => self::GRAD_ABD_FRINGE_RATE],
        ['code' => '9511', 'title' => 'Teaching Assistant', 'instructor_type' => InstructorType::TeachingAssistant, 'annual_load' => 2, 'fringe_rate' => self::GRAD_REGULAR_FRINGE_RATE],
        ['code' => '9519', 'title' => 'PhD Candidate Teaching Asst', 'instructor_type' => InstructorType::TeachingAssistant, 'annual_load' => 2, 'fringe_rate' => self::GRAD_ABD_FRINGE_RATE],
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
            $jobCode = $this->updateOrCreateJobCode($row);

            foreach (self::TERM_CODES as $termCode) {
                $this->updateOrCreateTermRate($jobCode, $termCode, $this->gradSalaryOf($termCode), $row['fringe_rate'], self::GRAD_SOURCE);
            }
        }
    }

    private function gradSalaryOf(int $termCode): float {
        return $termCode % 10 === self::FALL_SEASON_DIGIT ? self::GRAD_FALL_SALARY : self::GRAD_SPRING_SALARY;
    }

    private function updateOrCreateJobCode(array $row): JobCode {
        return JobCode::updateOrCreate(
            ['code' => $row['code']],
            [
                'title' => $row['title'],
                'instructor_type' => $row['instructor_type'],
                'annual_load' => $row['annual_load'],
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
