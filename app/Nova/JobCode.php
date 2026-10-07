<?php

namespace App\Nova;

use App\Library\TermPlan\InstructorType;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Laravel\Nova\Fields\HasMany;
use Laravel\Nova\Fields\ID;
use Laravel\Nova\Fields\Select;
use Laravel\Nova\Fields\Text;
use Laravel\Nova\Http\Requests\NovaRequest;

class JobCode extends Resource {
    public static $model = \App\JobCode::class;

    public static $title = 'code';

    public static $search = ['code', 'title'];

    public static $group = 'Term costs';

    public function authorizedToDelete(Request $request): bool {
        return !$this->resource->rates()->exists();
    }

    public function subtitle(): string {
        return $this->resource->title;
    }

    public function fields(NovaRequest $request): array {
        return [
            ID::make()->sortable(),

            Text::make('Code')
                ->sortable()
                ->rules('required', 'max:16')
                ->creationRules('unique:job_codes,code')
                ->updateRules('unique:job_codes,code,{{resourceId}}'),

            Text::make('Title')
                ->sortable()
                ->rules('required', 'max:255'),

            Select::make('Instructor Type', 'instructor_type')
                ->options(InstructorType::class)
                ->displayUsingLabels()
                ->sortable()
                ->rules('required', Rule::enum(InstructorType::class))
                ->help('The default for everyone holding this job code.'),

            HasMany::make('Rates', 'rates', JobCodeRate::class),
        ];
    }
}
