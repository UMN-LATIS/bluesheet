<?php


return array(

    /*
    |--------------------------------------------------------------------------
    | Views / Endpoints
    |--------------------------------------------------------------------------
    |
    | Set your login page, or login routes, here. If you provide a view,
    | that will be rendered. Otherwise, it will redirect to a route.
    |
     */

    'idp_login'     => '/Shibboleth.sso/Login',
    'idp_logout'    => '/Shibboleth.sso/Logout?return=https%3a%2f%2flogin.umn.edu%2fidp%2fLogoutUMN',
    'authenticated' => '/',
    'authfield'     => 'umndid',
    /*
    |--------------------------------------------------------------------------
    | Emulate an IdP
    |--------------------------------------------------------------------------
    |
    | In case you do not have access to your Shibboleth environment on
    | homestead or your own Vagrant box, you can emulate a Shibboleth
    | environment with the help of Shibalike.
    |
    | Do not use this in production for literally any reason.
    |
     */

    'emulate_idp'       => env('SHIB_EMULATE', false),
    'emulate_idp_users' => array(
        'admin' => array(
            'uid'         => 'admin',
            'displayName' => 'Admin User',
            'givenName'   => 'Admin',
            'surname'   => 'McAdmin',
            'sn'          => 'User',
            'eppn'        => 'admin@umn.edu',
            'umnDID'      => 'admin',
            'umnEmplId'      => '2328381',
        ),
        'staff' => array(
            'uid'         => 'staff',
            'displayName' => 'Staff User',
            'givenName'   => 'Staff',
            'surName'   => 'McStaff',
            'sn'          => 'User',
            'eppn'        => 'staff@umn.edu',
            'umnDID'      => 'staff',
        ),
        'user'  => array(
            'uid'         => 'user',
            'displayName' => 'User User',
            'givenName'   => 'User',
            'surname'   => 'McUser',
            'sn'          => 'User',
            'mail'        => 'user@umn.edu',
            'umnDID'      => 'user',
        ),
    ),

    /*
    |--------------------------------------------------------------------------
    | Server Variable Mapping
    |--------------------------------------------------------------------------
    |
    | Change these to the proper values for your IdP.
    |
     */

    'entitlement' => 'secret',

    'user' => [
        // fillable user model attribute => server variable
        'email'       => 'eppn',
        'umndid' => 'umnDID',
        'surname' => 'surname',
        'givenname' => 'givenName',
        'displayname' => 'displayName',
    ],

    /*
    |--------------------------------------------------------------------------
    | User Creation and Groups Settings
    |--------------------------------------------------------------------------
    |
    | Allows you to change if / how new users are added
    |
     */

    'add_new_users' => true, // Should new users be added automatically if they do not exist?

    /*
    |--------------------------------------------------------------------------
    | JWT Auth
    |--------------------------------------------------------------------------
    |
    | JWTs are for the front end to know it's logged in
    |
    | https://github.com/tymondesigns/jwt-auth
    | https://github.com/StudentAffairsUWM/Laravel-Shibboleth-Service-Provider/issues/24
    |
     */

    'jwtauth' => env('JWTAUTH', false),
);
