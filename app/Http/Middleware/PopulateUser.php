<?php

namespace App\Http\Middleware;

use Closure;
use Auth;
use App\Library\UserService;

class populateUser
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle($request, Closure $next)
    {
        if(Auth::user() && !Auth::user()->displayName) {
            (new UserService())->refreshProfileFromBandaid(Auth::user());
            Auth::user()->save();
        }
        if(Auth::user() && !Auth::user()->hasRole("basic user") && count(Auth::user()->roles) == 0) {
            Auth::user()->assignRole("basic user");
            Auth::user()->assignRole("view user");
        }
        return $next($request);
    }
}


