<?php

namespace App\Nova;

use Illuminate\Http\Request;
use Laravel\Nova\Fields\BelongsTo;
use Laravel\Nova\Fields\BelongsToMany;
use Laravel\Nova\Fields\Boolean;
use Laravel\Nova\Fields\DateTime;
use Laravel\Nova\Fields\HasMany;
use Laravel\Nova\Fields\ID;
use Laravel\Nova\Fields\Select;
use Laravel\Nova\Fields\Text;
use Laravel\Nova\Fields\Textarea;
use Laravel\Nova\Http\Requests\NovaRequest;

class Group extends Resource
{
    /**
     * The model the resource corresponds to.
     *
     * @var class-string<\App\Group>
     */
    public static $model = \App\Group::class;

    /**
     * The single value that should be used to represent the resource when being displayed.
     *
     * @var string
     */
    public static $title = 'group_title';

    /**
     * The columns that should be searched.
     *
     * @var array
     */
    public static $search = [
        'id', 'group_title', 'abbreviation', 'dept_id',
    ];

    /**
     * Get the fields displayed by the resource.
     *
     * @return array<int, \Laravel\Nova\Fields\Field>
     */
    public function fields(NovaRequest $request): array
    {
        return [
            ID::make()->sortable(),

            Text::make('Group Title', 'group_title')
                ->sortable()
                ->rules('required', 'max:255'),

            Text::make('Abbreviation')
                ->sortable()
                ->rules('max:255'),

            Text::make('Department ID', 'dept_id')
                ->sortable()
                ->rules('max:255'),

            Boolean::make('Private Group', 'private_group')
                ->sortable(),

            Boolean::make('Show Unit', 'show_unit')
                ->sortable(),

            Boolean::make('Include Child Groups', 'include_child_groups')
                ->sortable(),

            Text::make('Google Group', 'google_group')
                ->sortable()
                ->rules('max:255'),

            Textarea::make('Notes')
                ->rules('max:1000'),

            DateTime::make('Start Date', 'start_date')
                ->sortable()
                ->nullable(),

            DateTime::make('End Date', 'end_date')
                ->sortable()
                ->nullable(),

            BelongsTo::make('Parent Organization', 'parentOrganization', ParentOrganization::class)
                ->nullable(),

            BelongsTo::make('Group Type', 'groupType', GroupType::class)
                ->nullable(),

            BelongsTo::make('Parent Group', 'parentGroup', Group::class)
                ->nullable(),

            HasMany::make('Child Groups', 'childGroups', Group::class),

            HasMany::make('Members', 'members', Membership::class),

            HasMany::make('Artifacts', 'artifacts', GroupArtifact::class),

            HasMany::make('Course Sections', 'courseSections', CourseSection::class),

            BelongsToMany::make('Favorite Users', 'favoriteUsers', User::class),
        ];
    }

    /**
     * Get the cards available for the resource.
     *
     * @return array<int, \Laravel\Nova\Card>
     */
    public function cards(NovaRequest $request): array
    {
        return [];
    }

    /**
     * Get the filters available for the resource.
     *
     * @return array<int, \Laravel\Nova\Filters\Filter>
     */
    public function filters(NovaRequest $request): array
    {
        return [];
    }

    /**
     * Get the lenses available for the resource.
     *
     * @return array<int, \Laravel\Nova\Lenses\Lens>
     */
    public function lenses(NovaRequest $request): array
    {
        return [];
    }

    /**
     * Get the actions available for the resource.
     *
     * @return array<int, \Laravel\Nova\Actions\Action>
     */
    public function actions(NovaRequest $request): array
    {
        return [];
    }
}
