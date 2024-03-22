<?php

namespace App\Http\Middleware;

use Closure;
use Auth;
use App\Library\LDAP as LDAP;

class populateUser
{
    protected function isEmulatingShib() {
        return config('shibboleth.emulate_idp');
    }

    protected function isEmulatedUser($umndid) {
        return array_key_exists($umndid, config('shibboleth.emulate_idp_users'));
    }

    protected function getEmulatedUser($umndid) {
        if (!$this->isEmulatedUser($umndid)) {
            throw new \Exception("User {$umndid} is not an emulated user.");
        }

        $usernameParts = explode('_', $umndid, 2);
        $firstName = ucfirst($usernameParts[0]);
        $lastName = ucfirst($usernameParts[1]) ?? "Mc{$firstName}Face";

        return (object) [
            'umndid' => $umndid,
            'displayName' => "{$firstName} {$lastName}",
            'givenname' => $firstName,
            'surname' => $lastName,
            'email' => "{$umndid}@umn.edu",
            'office' => 'LATIS $ 110 AndH $ 257 19th Ave S $ Minneapolis, MN 55455-0425',
            'ou' => 'Lib Arts-TC'
        ];
    }

    /**
     * Lookup a user in LDAP, unless we're emulating
     */
    protected function lookupUser($lookupValue) {
        if ($this->isEmulatingShib() && $this->isEmulatedUser($lookupValue)) {
            return $this->getEmulatedUser($lookupValue);
        }

        return LDAP::lookupUserCached($lookupValue, "umndid");
    }

    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle($request, Closure $next) {
        if (Auth::user() && !Auth::user()->displayName) {
            $foundUser = LDAP::lookupUser(Auth::user()->umndid, "umndid");

            if ($foundUser) {
                Auth::user()->surname = $foundUser->surname;
                Auth::user()->givenname = $foundUser->givenname;
                Auth::user()->displayName = $foundUser->displayName;
                Auth::user()->email = $foundUser->email;
                Auth::user()->office = $foundUser->office;
                Auth::user()->ou = $foundUser->ou;
                Auth::user()->save();
            }
        }
        if(Auth::user() && !Auth::user()->hasRole("basic user") && count(Auth::user()->roles) == 0) {
            Auth::user()->assignRole("basic user");
            Auth::user()->assignRole("view user");
        }
        return $next($request);
    }
}
