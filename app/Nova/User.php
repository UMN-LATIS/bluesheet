<?php

namespace App\Nova;

use Illuminate\Http\Request;
use Laravel\Nova\Auth\PasswordValidationRules;
use Laravel\Nova\Fields\BelongsToMany;
use Laravel\Nova\Fields\Boolean;
use Laravel\Nova\Fields\Gravatar;
use Laravel\Nova\Fields\HasMany;
use Laravel\Nova\Fields\ID;
use Laravel\Nova\Fields\MorphToMany;
use Laravel\Nova\Fields\Text;
use Laravel\Nova\Http\Requests\NovaRequest;

class User extends Resource
{
    use PasswordValidationRules;

    /**
     * The model the resource corresponds to.
     *
     * @var class-string<\App\User>
     */
    public static $model = \App\User::class;

    /**
     * The single value that should be used to represent the resource when being displayed.
     *
     * @var string
     */
    public static $title = 'displayName';

    /**
     * The columns that should be searched.
     *
     * @var array
     */
    public static $search = [
        'id', 'displayName', 'email', 'umndid', 'givenname', 'surname',
    ];

    /**
     * Get the fields displayed by the resource.
     *
     * @return array<int, \Laravel\Nova\Fields\Field|\Laravel\Nova\Panel|\Laravel\Nova\ResourceTool|\Illuminate\Http\Resources\MergeValue>
     */
    public function fields(NovaRequest $request): array
    {
        return [
            ID::make()->sortable(),

            Gravatar::make()->maxWidth(50),

            Text::make('Profile', fn () => "<a href='".url('/user', $this->id)."'>View Profile</a>")
                ->asHtml(),
            
            Text::make('Display Name', 'displayName')
                ->sortable()
                ->rules('required', 'max:255'),

            Text::make('Given Name', 'givenname')
                ->sortable()
                ->rules('max:255'),

            Text::make('Surname', 'surname')
                ->sortable()
                ->rules('max:255'),

            Text::make('Email')
                ->sortable()
                ->rules('required', 'email', 'max:254')
                ->creationRules('unique:users,email')
                ->updateRules('unique:users,email,{{resourceId}}'),

            Text::make('UMN ID', 'umndid')
                ->sortable()
                ->rules('max:255'),

            Text::make('Employee ID', 'emplid')
                ->sortable()
                ->rules('max:255'),

            Text::make('Organizational Unit', 'ou')
                ->sortable()
                ->rules('max:255'),

            Text::make('Title')
                ->sortable()
                ->rules('max:255'),

            Text::make('Office')
                ->sortable()
                ->rules('max:255'),

            Text::make('Phone')
                ->sortable()
                ->rules('max:255'),

            Boolean::make('Send Email Reminders', 'send_email_reminders')
                ->sortable(),

            Boolean::make('Notify of Favorite Changes', 'notify_of_favorite_changes')
                ->sortable(),

            Boolean::make('SSL Eligible', 'ssl_eligible')
                ->sortable(),

            Boolean::make('Midcareer Eligible', 'midcareer_eligible')
                ->sortable(),

            Boolean::make('SSL Apply Eligible', 'ssl_apply_eligible')
                ->sortable(),

            // HasMany::make('Memberships', 'memberships', Membership::class),

            // HasMany::make('Leaves', 'leaves', Leave::class),

            // BelongsToMany::make('Favorite Groups', 'favoriteGroups', Group::class),

            // BelongsToMany::make('Favorite Roles', 'favoriteRoles', Role::class),



            MorphToMany::make('Spatie Roles', 'roles', SpatieRole::class),
            MorphToMany::make('Spatie Permissions', 'permissions', Permission::class)
            // // Spatie Permissions - System-level permissions for what users can do
            // ::make('Spatie Roles', 'permission_roles', \Spatie\Permission\Models\Role::class)
            //     ->fields(function () {
            //         return [
            //             Text::make('Guard Name', 'guard_name'),
            //         ];
            //     }),

            // MorphToMany::make('Spatie Permissions', 'permissions', \Spatie\Permission\Models\Permission::class)
            //     ->fields(function () {
            //         return [
            //             Text::make('Guard Name', 'guard_name'),
            //         ];
            //     }),
        ];
    }

    /**
     * Get the cards available for the request.
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
