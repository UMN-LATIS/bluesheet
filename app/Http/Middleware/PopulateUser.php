<?php

namespace App\Http\Middleware;

use Closure;
use Auth;
use App\Library\LDAP as LDAP;

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
            $foundUser = LDAP::lookupUser(Auth::user()->umndid, "umndid");
            if($foundUser) {
                Auth::user()->surname = $foundUser->surname;
                Auth::user()->givenname = $foundUser->givenname;
                Auth::user()->displayName = $foundUser->displayName;
                Auth::user()->email = $foundUser->email;
                Auth::user()->office = $foundUser->office;
                Auth::user()->ou = $foundUser->ou;
                Auth::user()->save();
            }
        }
        return $next($request);
    }
}
