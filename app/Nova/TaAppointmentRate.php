<?php

namespace App\Nova;

use App\Library\TermPlan\Season;
use App\Library\TermPlan\StudentStatus;
use Illuminate\Validation\Rule;
use Laravel\Nova\Fields\Currency;
use Laravel\Nova\Fields\ID;
use Laravel\Nova\Fields\Number;
use Laravel\Nova\Fields\Select;
use Laravel\Nova\Fields\Text;
use Laravel\Nova\Http\Requests\NovaRequest;

class TaAppointmentRate extends Resource {
    public static $model = \App\TaAppointmentRate::class;

    public static $title = 'id';

    public static $group = 'Term costs';

    public static function label(): string {
        return 'TA Appointment Rates';
    }

    public function fields(NovaRequest $request): array {
        return [
            ID::make()->sortable(),

            Number::make('Fiscal Year', 'fiscal_year')
                ->sortable()
                ->rules('required', 'integer', 'between:2000,2100')
                ->help('FY2027 runs from July 2026 to June 2027.'),

            Select::make('Season')
                ->options(Season::class)
                ->displayUsingLabels()
                ->sortable()
                ->rules('required', Rule::enum(Season::class)),

            Select::make('Student Status', 'student_status')
                ->options(StudentStatus::class)
                ->displayUsingLabels()
                ->sortable()
                ->rules('required', Rule::enum(StudentStatus::class)),

            Number::make('Appointment Percent', 'appointment_percent')
                ->step(0.01)
                ->sortable()
                ->displayUsing(fn($percent) => "{$percent}%")
                ->rules(fn(NovaRequest $request) => [
                    'required',
                    'decimal:0,2',
                    'gt:0',
                    'lte:100',
                    Rule::unique('ta_appointment_rates', 'appointment_percent')
                        ->where('fiscal_year', $request->input('fiscal_year'))
                        ->where('season', $request->input('season'))
                        ->where('student_status', $request->input('student_status'))
                        ->ignore($request->resourceId),
                ])
                ->help('Percent of full time, such as 25 or 50.'),

            Currency::make('Cost Per Term', 'cost_per_term')
                ->currency('USD')
                ->sortable()
                ->rules('required', 'decimal:0,2', 'min:0', 'max:99999999.99')
                ->help('Salary plus fringe for one term.'),

            Text::make('Source')
                ->nullable()
                ->rules('nullable', 'max:255'),
        ];
    }
}
