<?php

namespace App\Library\TermPlan;

final class CostSettings {
    private const DEFAULT_ANNUAL_LOADS = [
        'recurring_budget_faculty' => 4,
        'recurring_budget_pa' => 6,
        'contract_visiting' => 2,
        'pa_instructor' => 6,
        'graduate_instructor' => 2,
        'teaching_assistant' => 2,
    ];

    /** @return array<string, CostSettingDefinition> keyed by `key` */
    public static function all(): array {
        $definitions = [
            new CostSettingDefinition(
                'unstaffedSectionCost',
                'Unstaffed section',
                'Cost of a section with no instructor assigned yet.',
                CostSettingType::Money,
                10000,
            ),
            new CostSettingDefinition(
                'unratedJobCodeCost',
                'Job code without a rate',
                'Cost per course for an instructor whose job code has no rate for this fiscal year.',
                CostSettingType::Money,
                10000,
            ),
            new CostSettingDefinition(
                'taAppointmentPercent',
                'TA appointment per course',
                'Each TA costs one appointment at this percent per course. The cost is counted on the lecture section.',
                CostSettingType::Percent,
                25,
            ),
            new CostSettingDefinition(
                'isRecurringBudgetFree',
                'Recurring budget instructors add no cost',
                'Sections taught by recurring budget faculty or P&A count as $0.',
                CostSettingType::Toggle,
                true,
            ),
            new CostSettingDefinition(
                'isIndependentStudyFree',
                'Independent study adds no cost',
                'Sections with component IND count as $0.',
                CostSettingType::Toggle,
                true,
            ),
            new CostSettingDefinition(
                'isFieldworkFree',
                'Fieldwork adds no cost',
                'Sections with component FWK count as $0.',
                CostSettingType::Toggle,
                true,
            ),
            ...self::annualLoadDefinitions(),
        ];

        return collect($definitions)->keyBy('key')->all();
    }

    /** @return array<int, CostSettingDefinition> */
    private static function annualLoadDefinitions(): array {
        return array_map(
            fn(InstructorType $instructorType) => new CostSettingDefinition(
                "annualLoad.{$instructorType->value}",
                "Annual load: {$instructorType->label()}",
                'Courses each person of this type teaches in a year. Each term estimate uses half of this number.',
                CostSettingType::Count,
                self::DEFAULT_ANNUAL_LOADS[$instructorType->value],
            ),
            InstructorType::cases(),
        );
    }
}
