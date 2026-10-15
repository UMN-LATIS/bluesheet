<?php

namespace App\Nova;

use Laravel\Nova\Fields\Currency;
use Laravel\Nova\Fields\HasMany;
use Laravel\Nova\Fields\ID;
use Laravel\Nova\Fields\Number;
use Laravel\Nova\Fields\Text;
use Laravel\Nova\Http\Requests\NovaRequest;

class GradTermRate extends Resource {
    public static $model = \App\GradTermRate::class;

    public static $title = 'term_code';

    public static $search = ['term_code', 'source'];

    public static $group = 'Term costs';

    public static function label(): string {
        return 'Grad Term Rates';
    }

    public static function singularLabel(): string {
        return 'Grad Term Rate';
    }

    public function fields(NovaRequest $request): array {
        return [
            ID::make()->sortable(),

            Number::make('Term Code', 'term_code')
                ->sortable()
                ->rules('required', 'integer', 'between:1000,9999')
                ->creationRules('unique:grad_term_rates,term_code')
                ->updateRules('unique:grad_term_rates,term_code,{{resourceId}}')
                ->help('Fall 2026 is 1269 and Spring 2027 is 1273.'),

            $this->moneyField('Hourly Rate', 'hourly_rate')
                ->help('Pay per appointment hour.'),

            Number::make('Health Rate', 'health_rate')
                ->step(0.0001)
                ->rules('required', 'decimal:0,4', 'min:0', 'max:5')
                ->hideFromIndex()
                ->help('Fraction of pay. 0.289 = 28.9%.'),

            $this->moneyField('Tuition per Hour, Regular', 'tuition_per_hour_regular')->hideFromIndex(),

            $this->moneyField('Tuition per Hour, ABD', 'tuition_per_hour_abd')->hideFromIndex(),

            $this->moneyField('Fee Offset', 'fee_offset')
                ->hideFromIndex()
                ->help('Full amount, before the appointment level\'s share.'),

            $this->moneyField('International Offset', 'international_offset')->hideFromIndex(),

            $this->moneyField('Per Credit Payment', 'per_credit_payment')
                ->hideFromIndex()
                ->help('Paid to a grad instructor for each credit taught.'),

            Number::make('Default Appointment Percent', 'default_appointment_percent')
                ->step(0.01)
                ->rules('required', 'numeric', 'between:0,100')
                ->hideFromIndex()
                ->help('Appointment per section taught, before a section\'s own setting. 25 for 25%.'),

            Text::make('Source')
                ->nullable()
                ->rules('nullable', 'max:255'),

            HasMany::make('Appointment Levels', 'levels', GradAppointmentLevel::class),
        ];
    }

    private function moneyField(string $name, string $column): Currency {
        return Currency::make($name, $column)
            ->currency('USD')
            ->rules('required', 'decimal:0,2', 'min:0', 'max:99999999.99');
    }
}
