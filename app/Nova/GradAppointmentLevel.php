<?php

namespace App\Nova;

use Illuminate\Validation\Rule;
use Laravel\Nova\Fields\BelongsTo;
use Laravel\Nova\Fields\ID;
use Laravel\Nova\Fields\Number;
use Laravel\Nova\Http\Requests\NovaRequest;

class GradAppointmentLevel extends Resource {
    public static $model = \App\GradAppointmentLevel::class;

    public static $title = 'id';

    public static $group = 'Term costs';

    public static function label(): string {
        return 'Grad Appointment Levels';
    }

    public static function singularLabel(): string {
        return 'Grad Appointment Level';
    }

    public function fields(NovaRequest $request): array {
        return [
            ID::make()->sortable(),

            BelongsTo::make('Grad Term Rate', 'gradTermRate', GradTermRate::class)
                ->sortable()
                ->searchable(),

            Number::make('Appointment Percent', 'appointment_percent')
                ->step(0.01)
                ->sortable()
                ->rules(fn(NovaRequest $request) => [
                    'required',
                    'numeric',
                    'between:0.01,100',
                    // Nova posts the parent field as
                    // 'gradTermRate'. 'grad_term_rate_id'
                    // would be null and match no row.
                    Rule::unique('grad_appointment_levels', 'appointment_percent')
                        ->where('grad_term_rate_id', $request->input('gradTermRate'))
                        ->ignore($request->resourceId),
                ])
                ->help('12.5 for a 12.5% appointment.'),

            Number::make('Hours', 'hours')
                ->sortable()
                ->rules('required', 'integer', 'min:0', 'max:2080')
                ->help('Appointment hours in the term.'),
        ];
    }
}
