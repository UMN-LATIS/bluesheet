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
use App\Http\Controllers\Sis\TermController as SisTermController;
use App\Http\Controllers\Sis\GroupController as SisGroupController;
use App\Http\Controllers\Sis\GroupSectionController as SisGroupSectionController;
use App\Http\Controllers\Sis\GroupCourseController as SisGroupCourseController;
use App\Http\Controllers\Sis\GroupEmployeeController as SisGroupEmployeeController;
use App\Http\Controllers\Sis\GroupTermController as SisGroupTermController;
use App\Http\Controllers\Sis\GroupLeaveController as SisGroupLeaveController;
use App\Http\Controllers\LeavePlanning\GroupController as LeavePlanningGroupController;
use App\Http\Controllers\LeavePlanning\GroupLeaveController as LeavePlanningGroupLeaveController;
use App\Http\Controllers\LeavePlanning\GroupTeachingHistoryController as LeavePlanningGroupTeachingHistoryController;
use App\Http\Controllers\TermPlanning\CourseInstructorController as TermPlanningCourseInstructorController;
use App\Http\Controllers\TermPlanning\GroupCourseController as TermPlanningGroupCourseController;
use App\Http\Controllers\TermPlanning\GroupSectionController as TermPlanningGroupSectionController;
use App\Http\Controllers\TermPlanning\SectionBatchController as TermPlanningSectionBatchController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\LeavePermissionController;
use App\Http\Controllers\CoursePermissionController;
use App\Http\Controllers\GroupPermissionController;
use App\Http\Controllers\LeaveController;

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

    Route::get('terms/payrollDates', [TermController::class, 'payrollDates']);

    Route::get('eligibility/{type}', 'UserController@eligibility');

    // Laravel thinks the singular of `leaves` is `leaf`
    // so instead of using a resource, just define the routes
    Route::post('leaves', 'LeaveController@store');
    Route::get('leaves/{leave}', 'LeaveController@show');
    Route::put('leaves/{leave}', 'LeaveController@update');
    Route::delete('leaves/{leave}', 'LeaveController@destroy');

    Route::get('users/{leaveOwner}/leaves', 'UserLeaveController@index');

    Route::get('reports/deptLeavesReport', [ReportController::class, 'deptLeavesReport']);

    // Leave Artifacts
    Route::get('leaves/{leave}/artifacts', [LeaveArtifactController::class, 'index']);
    Route::get('leaves/{leave}/artifacts/{leaveArtifact}', [LeaveArtifactController::class, 'show']);
    Route::post('leaves/{leave}/artifacts', [LeaveArtifactController::class, 'store']);
    Route::put('leaves/{leave}/artifacts/{leaveArtifact}', [LeaveArtifactController::class, 'update']);
    Route::delete('leaves/{leave}/artifacts/{leaveArtifact}', [LeaveArtifactController::class, 'destroy']);

    Route::prefix('permissions')->group(function () {
        Route::get('leaves/{leave}', [LeavePermissionController::class, 'show']);
        Route::get('users/{leaveOwner}/leaves', [LeavePermissionController::class, 'userLeaves']);
        Route::get('groups/{group}/leaves', [LeavePermissionController::class, 'groupLeaves']);
        Route::get('groups/{group}/courses', [CoursePermissionController::class, 'groupCourses']);
        Route::get(
            'groups/{group}/subgroups',
            [GroupPermissionController::class, 'subgroups']
        );
    });

    // The plan a department is building for a term the SIS has not published.
    Route::prefix('term-planning')->group(function () {
        Route::get('/groups/{group}/courses', [TermPlanningGroupCourseController::class, 'index']);
        Route::post('/groups/{group}/courses', [TermPlanningGroupCourseController::class, 'store']);
        Route::get('/groups/{group}/course-instructors', [TermPlanningCourseInstructorController::class, 'index']);
        Route::get('/groups/{group}/sections', [TermPlanningGroupSectionController::class, 'index']);
        Route::post('/groups/{group}/sections', [TermPlanningGroupSectionController::class, 'store']);
        // Keep both batch routes above `sections/{section}`. Below it, the
        // delete matches that route instead and 404s looking for a section
        // whose id is "batch".
        Route::post('/groups/{group}/sections/batch', [TermPlanningSectionBatchController::class, 'store']);
        Route::delete('/groups/{group}/sections/batch', [TermPlanningSectionBatchController::class, 'destroy']);
        Route::put('/groups/{group}/sections/{section}', [TermPlanningGroupSectionController::class, 'update']);
        Route::delete('/groups/{group}/sections/{section}', [TermPlanningGroupSectionController::class, 'destroy']);
    });

    // Read-only views of the SIS data cached in the sis_ tables.
    Route::prefix('sis')->group(function () {
        Route::get('/terms', [SisTermController::class, 'index']);
        Route::get('/groups', [SisGroupController::class, 'index']);
        Route::get('/groups/{group}/sections', [SisGroupSectionController::class, 'index']);
        Route::get('/groups/{group}/courses', [SisGroupCourseController::class, 'index']);
        Route::get('/groups/{group}/employees', [SisGroupEmployeeController::class, 'index']);
        Route::get('/groups/{group}/terms', [SisGroupTermController::class, 'index']);
        Route::get('/groups/{group}/leaves', [SisGroupLeaveController::class, 'index']);
    });

    Route::prefix('leave-planning')->group(function () {
        Route::get('/groups', [LeavePlanningGroupController::class, 'index']);
        Route::get('/groups/{group}/leaves', [LeavePlanningGroupLeaveController::class, 'index']);
        Route::post('/groups/{group}/leaves', [LeavePlanningGroupLeaveController::class, 'store']);
        Route::get('/groups/{group}/teaching-history', [LeavePlanningGroupTeachingHistoryController::class, 'index']);
    });

    Route::post('groups/{group}/change-request', 'GroupController@requestChange');

    // Catchall 404 JSON route
    Route::any('{any}', function () {
        return response()->json(['message' => 'Not Found'], 404);
    })->where('any', '.*');
});

// routes with hash to allow unauthenticated loads
Route::get('/api/group/{group}/{hash}', 'GroupController@show');
Route::get('/api/group/{group}/members/{hash}', 'GroupController@members');

Route::get('/group/{group}/{hash}', 'HomeController@index');
Route::group(['middleware' => 'auth'], function () {
    Route::get('/', 'HomeController@index');
    Route::any('{all}', 'HomeController@index')->where(['all' => '.*']);
});
