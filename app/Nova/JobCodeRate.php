<?php

namespace App\Nova;

use Illuminate\Validation\Rule;
use Laravel\Nova\Fields\BelongsTo;
use Laravel\Nova\Fields\Currency;
use Laravel\Nova\Fields\ID;
use Laravel\Nova\Fields\Number;
use Laravel\Nova\Fields\Text;
use Laravel\Nova\Http\Requests\NovaRequest;

class JobCodeRate extends Resource {
    public static $model = \App\JobCodeRate::class;

    public static $title = 'id';

    public static $group = 'Term costs';

    public function fields(NovaRequest $request): array {
        return [
            ID::make()->sortable(),

            BelongsTo::make('Job Code', 'jobCode', JobCode::class)
                ->sortable()
                ->searchable()
                ->withSubtitles(),

            Number::make('Fiscal Year', 'fiscal_year')
                ->sortable()
                ->rules(fn(NovaRequest $request) => [
                    'required',
                    'integer',
                    'between:2000,2100',
                    // Nova posts this field as 'jobCode'.
                    // 'job_code_id' would be null and
                    // match no row.
                    Rule::unique('job_code_rates', 'fiscal_year')
                        ->where('job_code_id', $request->input('jobCode'))
                        ->ignore($request->resourceId),
                ])
                ->help('FY2027 runs from July 2026 to June 2027.'),

            Currency::make('Cost Per Course', 'cost_per_course')
                ->currency('USD')
                ->sortable()
                ->rules('required', 'decimal:0,2', 'min:0', 'max:99999999.99')
                ->help('Average cost of one course taught by someone holding this job code.'),

            Text::make('Source')
                ->nullable()
                ->rules('nullable', 'max:255'),
        ];
    }
}
