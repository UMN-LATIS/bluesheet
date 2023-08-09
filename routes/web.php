<?php

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::impersonate();

if (config('shibboleth.emulate_idp') ) {

    Route::name('login')->get("login", '\StudentAffairsUwm\Shibboleth\Controllers\ShibbolethController@emulateLogin');
    # comment out for production shib
    Route::group(['middleware' => 'web'], function () {
        Route::get('emulated/idp', '\StudentAffairsUwm\Shibboleth\Controllers\ShibbolethController@emulateIdp');
        Route::post('emulated/idp', '\StudentAffairsUwm\Shibboleth\Controllers\ShibbolethController@emulateIdp');
        Route::get('emulated/login', '\StudentAffairsUwm\Shibboleth\Controllers\ShibbolethController@emulateLogin');
        Route::get('emulated/logout', '\StudentAffairsUwm\Shibboleth\Controllers\ShibbolethController@emulateLogout');
        Route::get('/shibboleth-logout', '\StudentAffairsUwm\Shibboleth\Controllers\ShibbolethController@emulateLogout');
    });
}
else {
    Route::name('login')->get("login", '\StudentAffairsUwm\Shibboleth\Controllers\ShibbolethController@login');
    Route::group(['middleware' => 'web'], function () {
        Route::name('shibboleth-login')->get('/shibboleth-login', '\StudentAffairsUwm\Shibboleth\Controllers\ShibbolethController@login');
        Route::name('shibboleth-authenticate')->get('/shibboleth-authenticate', '\StudentAffairsUwm\Shibboleth\Controllers\ShibbolethController@idpAuthenticate');
        Route::name('shibboleth-logout')->get('/shibboleth-logout', '\StudentAffairsUwm\Shibboleth\Controllers\ShibbolethController@destroy');
    });

}


Route::group(['prefix'=>'/api/', 'middleware' => 'auth'], function () {

    Route::get('autocompleter/user', 'AutocompleteController@userAutocompleter');

    Route::post('user/lookup', 'UserController@userLookup');
    Route::resource('user', 'UserController');
    Route::get('role/{role}', 'GroupController@role');
    
    Route::get('group/roles', 'GroupController@roles');
    
    
    Route::get('group/types', 'GroupController@types');
    Route::get('group/parents', 'GroupController@parents');
    Route::get('folder/{parentOrganization?}', 'GroupController@getGroupsByFolder');
    Route::post('group/search', 'GroupController@groupSearch');

    Route::resource('group', 'GroupController');
    Route::get('group/{group}/members', 'GroupController@members');
    
    Route::post("user/favorite/groups/{group}", "UserController@addFavoriteGroup");
    Route::post("user/favorite/roles/{role}", "UserController@addFavoriteRole");
    Route::delete("user/favorite/groups/{group}", "UserController@destroyFavoriteGroup");
    Route::delete("user/favorite/roles/{role}", "UserController@destroyFavoriteRole");

    Route::get('lookup/department/{deptId?}', 'LookupController@departmentInfo');

    Route::get('group/schedulingReport/{group}/{term?}', 'SchedulingController@getSchedulingReport');
    Route::get('terms', 'SchedulingController@getTerms');
    Route::resource('leaves', LeaveController::class);
});

// routes with hash to allow unauthenticated loads
Route::get('/api/group/{group}/{hash}', 'GroupController@show');
Route::get('/api/group/{group}/members/{hash}', 'GroupController@members');


// Route::resource('users', 'Admin\\UsersController');
Route::group(['prefix'=>'admin', 'middleware' => ['auth', 'permission:edit users']], function () {
    Route::resource('/', 'Admin\\AdminController');
    Route::resource('users', 'Admin\\UsersController');
    Route::resource('group-type', 'Admin\\GroupTypeController');
    Route::resource('role', 'Admin\\RoleController');
});

Route::get('/group/{group}/{hash}', 'HomeController@index');
Route::group(['middleware' => 'auth'], function () {
    Route::get('/', 'HomeController@index');
    Route::any('{all}','HomeController@index')->where(['all' => '.*']);
});
