<?php

namespace App\Library\TermPlan;

enum InstructorType: string {
    case RecurringBudgetFaculty = 'recurring_budget_faculty';
    case RecurringBudgetPa = 'recurring_budget_pa';
    case ContractVisiting = 'contract_visiting';
    case PaInstructor = 'pa_instructor';
    case GraduateInstructor = 'graduate_instructor';
    case TeachingAssistant = 'teaching_assistant';

    public function label(): string {
        return match ($this) {
            self::RecurringBudgetFaculty => 'Recurring budget faculty',
            self::RecurringBudgetPa => 'Recurring budget P&A',
            self::ContractVisiting => 'Contract / visiting',
            self::PaInstructor => 'P&A instructor',
            self::GraduateInstructor => 'Graduate instructor',
            self::TeachingAssistant => 'Teaching assistant',
        };
    }
}
