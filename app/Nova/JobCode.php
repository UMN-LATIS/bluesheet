<?php

namespace App\Nova;

use App\Library\TermPlan\InstructorType;
use App\Library\TermPlan\StudentStatus;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Laravel\Nova\Fields\HasMany;
use Laravel\Nova\Fields\ID;
use Laravel\Nova\Fields\Number;
use Laravel\Nova\Fields\Select;
use Laravel\Nova\Fields\Text;
use Laravel\Nova\Http\Requests\NovaRequest;

class JobCode extends Resource {
    public static $model = \App\JobCode::class;

    public static $title = 'code';

    public static $search = ['code', 'title'];

    public static $group = 'Term costs';

    public function authorizedToDelete(Request $request): bool {
        return !$this->resource->termRates()->exists();
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
                ->help('TBA holds the rate for a section with no instructor, and for a job code with no rate.')
                ->creationRules('unique:job_codes,code')
                ->updateRules('unique:job_codes,code,{{resourceId}}'),

            Text::make('Title')
                ->sortable()
                ->rules('required', 'max:255'),

            Select::make('Instructor Type', 'instructor_type')
                ->options(InstructorType::class)
                ->displayUsingLabels()
                ->sortable()
                ->nullable()
                ->rules('nullable', Rule::enum(InstructorType::class))
                ->help('The default for everyone holding this job code. Blank for TBA.'),

            Number::make('Annual Load', 'annual_load')
                ->nullable()
                ->rules('nullable', 'integer', 'min:0', 'max:40')
                ->help('Courses a person with this job code teaches in a year. The People tab expects half of it each term.'),

            Select::make('Student Status', 'student_status')
                ->options(StudentStatus::class)
                ->displayUsingLabels()
                ->nullable()
                ->rules('nullable', Rule::enum(StudentStatus::class))
                ->help('For grad job codes: ABD pays the lower tuition per hour. Blank means regular.'),

            HasMany::make('Term Rates', 'termRates', JobCodeTermRate::class),
        ];
    }
}
