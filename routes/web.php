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

use App\Http\Controllers\LeaveArtifactController;
use App\Http\Controllers\TermController;
use App\Http\Controllers\CoursePlanning\GroupSectionController;
use App\Http\Controllers\CoursePlanning\GroupEnrollmentController;
use App\Http\Controllers\CoursePlanning\GroupPersonController;
use App\Http\Controllers\CoursePlanning\GroupLeaveController;
use App\Http\Controllers\CoursePlanning\GroupCourseController;

Route::impersonate();

if (config('shibboleth.emulate_idp')) {

    Route::name('login')->get("login", '\StudentAffairsUwm\Shibboleth\Controllers\ShibbolethController@emulateLogin');
    # comment out for production shib
    Route::group(['middleware' => 'web'], function () {
        Route::get('emulated/idp', '\StudentAffairsUwm\Shibboleth\Controllers\ShibbolethController@emulateIdp');
        Route::post('emulated/idp', '\StudentAffairsUwm\Shibboleth\Controllers\ShibbolethController@emulateIdp');
        Route::get('emulated/login', '\StudentAffairsUwm\Shibboleth\Controllers\ShibbolethController@emulateLogin');
        Route::get('emulated/logout', '\StudentAffairsUwm\Shibboleth\Controllers\ShibbolethController@emulateLogout');
        Route::get('/shibboleth-logout', '\StudentAffairsUwm\Shibboleth\Controllers\ShibbolethController@emulateLogout');
    });
} else {
    Route::name('login')->get("login", '\StudentAffairsUwm\Shibboleth\Controllers\ShibbolethController@login');
    Route::group(['middleware' => 'web'], function () {
        Route::name('shibboleth-login')->get('/shibboleth-login', '\StudentAffairsUwm\Shibboleth\Controllers\ShibbolethController@login');
        Route::name('shibboleth-authenticate')->get('/shibboleth-authenticate', '\StudentAffairsUwm\Shibboleth\Controllers\ShibbolethController@idpAuthenticate');
        Route::name('shibboleth-logout')->get('/shibboleth-logout', '\StudentAffairsUwm\Shibboleth\Controllers\ShibbolethController@destroy');
    });
}

Route::group(['prefix' => '/api/', 'middleware' => 'auth'], function () {

    Route::get('autocompleter/user', 'AutocompleteController@userAutocompleter');

    Route::post('user/lookup', 'UserController@userLookup');
    Route::resource('user', 'UserController');
    Route::get('role/{role}', 'GroupController@role');

    Route::get('group/roles', 'GroupController@roles');

    Route::get('group/admins', 'GroupController@getGroupsWithAdmins');
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

    Route::get('terms', [TermController::class, 'index']);
    Route::get('eligibility/{type}', 'UserController@eligibility');

    // Laravel thinks the singular of `leaves` is `leaf`
    // so instead of using a resource, just define the routes
    Route::post('leaves', 'LeaveController@store');
    Route::get('leaves/{leave}', 'LeaveController@show');
    Route::put('leaves/{leave}', 'LeaveController@update');
    Route::delete('leaves/{leave}', 'LeaveController@destroy');
    Route::get('users/{user}/leaves', 'UserLeaveController@index');
    Route::put('users/{user}/leaves', 'UserLeaveController@update');

    // Leave Artifacts
    Route::get('leaves/{leave}/artifacts', [LeaveArtifactController::class, 'index']);
    Route::get('leaves/{leave}/artifacts/{leaveArtifact}', [LeaveArtifactController::class, 'show']);
    Route::post('leaves/{leave}/artifacts', [LeaveArtifactController::class, 'store']);
    Route::put('leaves/{leave}/artifacts/{leaveArtifact}', [LeaveArtifactController::class, 'update']);
    Route::delete('leaves/{leave}/artifacts/{leaveArtifact}', [LeaveArtifactController::class, 'destroy']);

    Route::prefix('course-planning')->group(function () {
        Route::resource('/groups/{group}/courses', GroupCourseController::class);
        Route::resource('/groups/{group}/sections', GroupSectionController::class);
        Route::resource('/groups/{group}/enrollments', GroupEnrollmentController::class);
        Route::get('/groups/{group}/people', [GroupPersonController::class, 'index']);
        Route::get('/groups/{group}/leaves', [GroupLeaveController::class, 'index']);
    });

    // Catchall 404 JSON route
    Route::any('{any}', function () {
        return response()->json(['message' => 'Not Found'], 404);
    })->where('any', '.*');
});

// routes with hash to allow unauthenticated loads
Route::get('/api/group/{group}/{hash}', 'GroupController@show');
Route::get('/api/group/{group}/members/{hash}', 'GroupController@members');

// Route::resource('users', 'Admin\\UsersController');
Route::group(['prefix' => 'admin', 'middleware' => ['auth', 'permission:edit users']], function () {
    Route::resource('/', 'Admin\\AdminController');
    Route::resource('users', 'Admin\\UsersController');
    Route::resource('group-type', 'Admin\\GroupTypeController');
    Route::resource('role', 'Admin\\RoleController');
});

Route::get('/group/{group}/{hash}', 'HomeController@index');
Route::group(['middleware' => 'auth'], function () {
    Route::get('/', 'HomeController@index');
    Route::any('{all}', 'HomeController@index')->where(['all' => '.*']);
});
