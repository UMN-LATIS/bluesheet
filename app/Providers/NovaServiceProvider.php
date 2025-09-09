<?php

namespace App\Providers;

use App\User;
use Illuminate\Support\Facades\Gate;
use Laravel\Fortify\Features;
use Laravel\Nova\Nova;
use Laravel\Nova\NovaApplicationServiceProvider;

class NovaServiceProvider extends NovaApplicationServiceProvider
{
    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        parent::boot();

        $this->resources();
    }

    /**
     * Register the Nova resources.
     */
    protected function resources(): void
    {
        Nova::resources([
            \App\Nova\User::class,
            \App\Nova\Group::class,
            \App\Nova\GroupType::class,
            \App\Nova\Role::class,
            \App\Nova\Membership::class,
            \App\Nova\Leave::class,
            \App\Nova\LeaveArtifact::class,
            \App\Nova\Course::class,
            \App\Nova\CourseSection::class,
            \App\Nova\Permission::class,
            \App\Nova\SpatieRole::class,
            \App\Nova\ParentOrganization::class,
            \App\Nova\GroupArtifact::class,
        ]);
    }

    /**
     * Register the configurations for Laravel Fortify.
     */
    protected function fortify(): void
    {
        Nova::fortify()
            ->features([
                Features::updatePasswords(),
                // Features::emailVerification(),
                // Features::twoFactorAuthentication(['confirm' => true, 'confirmPassword' => true]),
            ])
            ->register();
    }

    /**
     * Register the Nova routes.
     */
    protected function routes(): void
    {
        Nova::routes()
            ->withoutAuthenticationRoutes()
            ->withoutPasswordResetRoutes()
            ->withoutEmailVerificationRoutes()
            ->register();
    }

    /**
     * Register the Nova gate.
     *
     * This gate determines who can access Nova in non-local environments.
     */
    protected function gate(): void
    {
        Gate::define('viewNova', function (User $user) {
            // Allow access if user has the 'edit users' permission (from your existing admin system)
            return $user->can('edit users');
        });
    }

    /**
     * Get the dashboards that should be listed in the Nova sidebar.
     *
     * @return array<int, \Laravel\Nova\Dashboard>
     */
    protected function dashboards(): array
    {
        return [
            new \App\Nova\Dashboards\Main,
        ];
    }

    /**
     * Get the tools that should be listed in the Nova sidebar.
     *
     * @return array<int, \Laravel\Nova\Tool>
     */
    public function tools(): array
    {
        return [];
    }

    /**
     * Register any application services.
     */
    public function register(): void
    {
        parent::register();

        //
    }
}
