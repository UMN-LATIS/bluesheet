<?php

namespace Database\Seeders;

use App\JobCode;
use App\JobCodeRate;
use App\Library\TermPlan\InstructorType;
use App\Library\TermPlan\Season;
use App\Library\TermPlan\StudentStatus;
use App\TaAppointmentRate;
use Illuminate\Database\Seeder;

class TermCostSampleRatesSeeder extends Seeder {
    private const FISCAL_YEAR = 2027;

    private const JOB_CODES = [
        ['code' => '9401', 'title' => 'Professor', 'instructor_type' => InstructorType::RecurringBudgetFaculty, 'cost_per_course' => 0],
        ['code' => '9402', 'title' => 'Associate Professor', 'instructor_type' => InstructorType::RecurringBudgetFaculty, 'cost_per_course' => 0],
        ['code' => '9403', 'title' => 'Assistant Professor', 'instructor_type' => InstructorType::RecurringBudgetFaculty, 'cost_per_course' => 0],
        ['code' => '9753', 'title' => 'Lecturer', 'instructor_type' => InstructorType::PaInstructor, 'cost_per_course' => 10000],
        ['code' => '9754', 'title' => 'Teaching Specialist', 'instructor_type' => InstructorType::PaInstructor, 'cost_per_course' => 8000],
        ['code' => '9404', 'title' => 'Instructor (temporary)', 'instructor_type' => InstructorType::ContractVisiting, 'cost_per_course' => 9500],
        ['code' => '9515', 'title' => 'Graduate Instructor', 'instructor_type' => InstructorType::GraduateInstructor, 'cost_per_course' => 10000],
        ['code' => '9511', 'title' => 'Teaching Assistant', 'instructor_type' => InstructorType::TeachingAssistant],
    ];

    private const TA_RATES = [
        ['appointment_percent' => 12.5, 'regular' => ['fall' => 7272.27, 'spring' => 7208.70], 'abd' => ['fall' => 5138.78, 'spring' => 5096.20]],
        ['appointment_percent' => 25, 'regular' => ['fall' => 13577.79, 'spring' => 13450.65], 'abd' => ['fall' => 9310.80, 'spring' => 9225.66]],
        ['appointment_percent' => 37.5, 'regular' => ['fall' => 19807.58, 'spring' => 19616.87], 'abd' => ['fall' => 13482.83, 'spring' => 13355.11]],
        ['appointment_percent' => 50, 'regular' => ['fall' => 26188.83, 'spring' => 25934.55], 'abd' => ['fall' => 17654.85, 'spring' => 17484.56]],
        ['appointment_percent' => 75, 'regular' => ['fall' => 38648.41, 'spring' => 38266.99], 'abd' => ['fall' => 25998.90, 'spring' => 25743.47]],
    ];

    public function run(): void {
        foreach (self::JOB_CODES as $row) {
            $jobCode = JobCode::updateOrCreate(
                ['code' => $row['code']],
                ['title' => $row['title'], 'instructor_type' => $row['instructor_type']],
            );

            if (array_key_exists('cost_per_course', $row)) {
                JobCodeRate::updateOrCreate(
                    ['job_code_id' => $jobCode->id, 'fiscal_year' => self::FISCAL_YEAR],
                    ['cost_per_course' => $row['cost_per_course'], 'source' => 'Sample data'],
                );
            }
        }

        foreach (self::TA_RATES as $row) {
            foreach (StudentStatus::cases() as $studentStatus) {
                foreach ($row[$studentStatus->value] as $season => $costPerTerm) {
                    $this->updateOrCreateTaAppointmentRate(
                        $row['appointment_percent'],
                        Season::from($season),
                        $studentStatus,
                        $costPerTerm,
                    );
                }
            }
        }
    }

    private function updateOrCreateTaAppointmentRate(
        float $appointmentPercent,
        Season $season,
        StudentStatus $studentStatus,
        float $costPerTerm,
    ): void {
        TaAppointmentRate::updateOrCreate(
            [
                'fiscal_year' => self::FISCAL_YEAR,
                'season' => $season,
                'student_status' => $studentStatus,
                'appointment_percent' => $appointmentPercent,
            ],
            ['cost_per_term' => $costPerTerm, 'source' => 'FY27 Grad Salary & Fringe Calculator'],
        );
    }
}
