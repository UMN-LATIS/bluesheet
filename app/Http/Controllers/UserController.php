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
        
        if($user != Auth::user() && Auth::user()->site_permissions < 200) {
            $returnData = array(
                'status' => 'error',
                'message' => "You don't have permission to view this user"
            );
            return Response()->json($returnData, 500);
        }
        else {
            $user->load(['memberships', 'memberships.group', 'memberships.role']);
        
            return new UserResource($user);    
        }
        
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $user)
    {
        if(Auth::user()->site_permissions < 200) {
            $returnData = array(
                'status' => 'error',
                'message' => "You don't have permission to create a user"
            );
            return Response()->json($returnData, 500);
        }
        $user->fill($request->all());
        $user->save();
        $returnData = array(
            'status' => 'success',
        );
        return Response()->json($returnData);
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

    function extract_emails($str){
        // This regular expression extracts all emails from a string:
        $regexp = '/([a-z0-9_\.\-])+\@(([a-z0-9\-])+\.)+([a-z0-9]{2,4})+/i';
        preg_match_all($regexp, $str, $m);

        return isset($m[0]) ? $m[0] : array();
    }


    public function userLookup(Request $request) {

        $userIds = $request->get('users');

        if(is_array($userIds) && count($userIds) == count(array_filter($userIds, 'is_numeric'))) {
            $users = \App\User::whereIn("id", $userIds)->get();
            $code = 200;
            $returnData['status'] = "Success";
            $returnData['users'] = UserResource::collection($users);
            return Response()->json($returnData, $code);
        }

        if(!strstr($userIds, "@")) {
            $cleanedList = explode(",", $userIds);
        }
        else {
            $emailList = $this->extract_emails($userIds);
            $cleanedList = [];
            foreach($emailList as $entry) {
                $explodedAddress = explode("@", $entry);
                $cleanedList[] = array_shift($explodedAddress);
            }
        }
        
        $outputArray = [];
        $notFoundUser = [];
        foreach($cleanedList as $userId) {
            $userId = trim($userId);
            $user = \App\User::where("email", $userId . "@umn.edu")->first();
            if($user) {
                $outputArray[] = new UserResource($user);
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
                $foundUser = null;
                foreach($search as $readItem) {

                    $info = ldap_get_entries($connect, $readItem);
                    if(!isset($info[0]["umndid"])) {
                        continue;
                    }
                    $foundUser = new \App\User;
                    $foundUser->umndid = isset($info[0]["umndid"])?$info[0]["umndid"][0]:"";
                    $foundUser->surname = isset($info[0]["sn"])?$info[0]["sn"][0]:"";
                    $foundUser->givenname = isset($info[0]["givenname"])?$info[0]["givenname"][0]:"";
                    $foundUser->displayName =isset( $info[0]["displayname"])?$info[0]["displayname"][0]:"";
                    $foundUser->email =isset( $info[0]["mail"])?$info[0]["mail"][0]:"";
                    $foundUser->office = isset($info[0]["umnofficeaddress1"])?$info[0]["umnofficeaddress1"][0]:"";
                    $foundUser->site_permissions = 100;
                    break;
                }
                
                if($foundUser) {
                    $foundUser->save();
                    $outputArray[] = new UserResource($foundUser);   
                }
                else {
                    $notFoundUser[] = $userId;
                }
            }    
        }
        

        $returnData = [];
        $code = 200;
        if(count($notFoundUser) == 0) {
            $returnData['status'] = "Success";
            $returnData['users'] = $outputArray;
        }
        else if(count($outputArray) == 0) {
            $returnData['status'] = "Error";
            $returnData['message'] = "We couldn't find that user.";
            $code = 500;
        }
        else {
            $returnData['status'] = "Partial";
            $returnData['users'] = $outputArray;
            $returnData['message'] = "We couldn't find these users: " . join(",", $notFoundUser);
        }


        return Response()->json($returnData, $code);
    }

}
