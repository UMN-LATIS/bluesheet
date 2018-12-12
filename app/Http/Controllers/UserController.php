<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Auth;
use DB;
use App\Http\Resources\User as UserResource;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($user=null)
    {
        // we might not get a user, and we override default laravel checks
        if(!$user) {
            $user = Auth::user();
        }
        else {
            // TODO: check perms for this??
        }
        $user->load(['memberships', 'memberships.group', 'memberships.role']);
        
        return new UserResource($user);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        //
    }

    public function userLookup($userId) {

        $user = \App\User::where("email", $userId . "@umn.edu")->first();
        if($user) {
            return new UserResource($user);
        }
        else {
            $foundUser = null;
            putenv('LDAPTLS_REQCERT=never');
            $connect = ldap_connect( 'ldaps://ldap-dsee.oit.umn.edu', 636);
            $base_dn = array("o=University of Minnesota, c=US",);
            ldap_set_option($connect, LDAP_OPT_PROTOCOL_VERSION, 3);
            ldap_set_option($connect, LDAP_OPT_REFERRALS, 0);
            $r=ldap_bind($connect);

            $filter = "(cn=" . $userId . ")";
            $search = ldap_search([$connect], $base_dn, $filter);
            
            foreach($search as $readItem) {

                $info = ldap_get_entries($connect, $readItem);
                $foundUser = new \App\User;
                $foundUser->umndid = isset($info[0]["umndid"])?$info[0]["umndid"][0]:$username;
                $foundUser->surname = isset($info[0]["sn"])?$info[0]["sn"][0]:$username;
                $foundUser->givenname = isset($info[0]["givenname"])?$info[0]["givenname"][0]:$username;
                $foundUser->displayName =isset( $info[0]["displayname"])?$info[0]["displayname"][0]:$username;
                $foundUser->email =isset( $info[0]["mail"])?$info[0]["mail"][0]:$username;
                $foundUser->office = isset($info[0]["umnofficeaddress1"])?$info[0]["umnofficeaddress1"][0]:$username;
                $foundUser->site_permissions = 100;
                break;
            }
            
            if($foundUser) {
                $foundUser->save();
                return new UserResource($foundUser);    
            }
            
        }


        $returnData = array(
            'status' => 'error',
            'message' => "We couldn't find that user.  Make sure you're using a University of Minnesota InternetID (without the @umn.edu)"
        );
        return Response()->json($returnData, 500);
    }

}
