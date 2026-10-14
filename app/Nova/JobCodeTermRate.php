<?php

namespace App\Nova;

use Illuminate\Validation\Rule;
use Laravel\Nova\Fields\BelongsTo;
use Laravel\Nova\Fields\Currency;
use Laravel\Nova\Fields\ID;
use Laravel\Nova\Fields\Number;
use Laravel\Nova\Fields\Text;
use Laravel\Nova\Http\Requests\NovaRequest;

class JobCodeTermRate extends Resource {
    public static $model = \App\JobCodeTermRate::class;

    public static $title = 'id';

    public static $group = 'Term costs';

    public function fields(NovaRequest $request): array {
        return [
            ID::make()->sortable(),

            BelongsTo::make('Job Code', 'jobCode', JobCode::class)
                ->sortable()
                ->searchable()
                ->withSubtitles(),

            Number::make('Term Code', 'term_code')
                ->sortable()
                ->rules(fn(NovaRequest $request) => [
                    'required',
                    'integer',
                    'between:1000,9999',
                    // Nova posts the job code field as
                    // 'jobCode'. 'job_code_id' would be
                    // null and match no row.
                    Rule::unique('job_code_term_rates', 'term_code')
                        ->where('job_code_id', $request->input('jobCode'))
                        ->ignore($request->resourceId),
                ])
                ->help('Fall 2026 is 1269 and Spring 2027 is 1273.'),

            Currency::make('Salary', 'salary')
                ->currency('USD')
                ->sortable()
                ->rules('required', 'decimal:0,2', 'min:0', 'max:99999999.99')
                ->help('Per paid section, or per course for a teaching assistant job code.'),

            Number::make('Fringe Rate', 'fringe_rate')
                ->step(0.0001)
                ->sortable()
                ->rules('required', 'decimal:0,4', 'min:0', 'max:5')
                ->help('0.385 = 38.5%. Grad codes: GA health % + tuition per hour ÷ hourly rate.'),

            Text::make('Source')
                ->nullable()
                ->rules('nullable', 'max:255'),
        ];
    }
}
