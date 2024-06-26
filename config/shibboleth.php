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
    'authfield'     => 'emplid',
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
            'umnEmplId'      => '1111112',
        ),
        'user'  => array(
            'uid'         => 'user',
            'displayName' => 'User User',
            'givenName'   => 'User',
            'surname'   => 'McUser',
            'sn'          => 'User',
            'mail'        => 'user@umn.edu',
            'umnDID'      => 'user',
            'umnEmplId'      => '1111113',
        ),

        // users for testing roles
        'basic_user' => [
            'uid' => 'basic_user',
            'displayName' => 'Basic User',
            'givenName' => 'Basic',
            'surname' => 'User',
            'sn' => 'User',
            'mail' => 'basic_user@umn.edu',
            'umnDID' => 'basic_user',
            'umnEmplId'      => '1111114',
        ],
        'view_user' => [
            'uid' => 'view_user',
            'displayName' => 'View User',
            'givenName' => 'View',
            'surname' => 'User',
            'sn' => 'User',
            'mail' => 'view_user@umn.edu',
            'umnDID' => 'view_user',
            'umnEmplId'      => '1111115',
        ],
        'global_group_admin' => [
            'uid' => 'global_group_admin',
            'displayName' => 'Global Group Admin',
            'givenName' => 'Global Group',
            'surname' => 'Admin',
            'sn' => 'Admin',
            'mail' => 'global_group_admin@umn.edu',
            'umnDID' => 'global_group_admin',
            'umnEmplId'      => '1111116',
        ],
        'site_admin' => [
            'uid' => 'site_admin',
            'displayName' => 'Site Admin',
            'givenName' => 'Site',
            'surname' => 'Admin',
            'sn' => 'Admin',
            'mail' => 'site_admin@umn.edu',
            'umnDID' => 'site_admin',
            'umnEmplId'      => '1111117',
        ]
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
        'emplid' => 'umnEmplId',
        // 'surname' => 'surname',
        // 'givenname' => 'givenName',
        // 'displayname' => 'displayName',
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
