<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use DB;
use Auth;

class AutocompleteController extends Controller
{
    public function userAutocompleter(Request $req) {
        
        $searchValue = $req->input('q');
        $mergedSearch = false;
        $field = "displayname";

        if($req->input('searchType')) {
            switch($req->input('searchType')) {
                case "nameAndInternetId":
                    $mergedSearch = true;
                    $field = "displayname";
                    $searchString = "*".str_replace(" ", "* ", $searchValue) . "*";
                    break;
                case "name":
                    $field = "displayname";
                    $searchString = "*".str_replace(" ", "* ", $searchValue) . "*";
                    break;
                case "internetId":
                    $field = "uid";
                    break;
                case "umndid": 
                    $field = "umndid";
                    break;
                default:
                    $field = "displayname";
                    $searchString = "*".str_replace(" ", "* ", $searchValue) . "*";
                    break;
            }
        }
        
        
        
        
        $filter = "(" . $field ."=" . $searchString. ")";
        $returnArray = $this->ldapLookup($filter);

        if($mergedSearch) {
            $userDiscovery = $this->ldapLookup("(uid=" . $searchValue . ")");
            if(count($userDiscovery) > 0) {
                \array_unshift($returnArray, $userDiscovery[0]);
            }
        }

        $returnArray = array_values(array_intersect_key($returnArray, array_unique(array_column($returnArray, 'umndid'))));

        return response()->json(["items" => $returnArray]);
        
        
        
    }

    private function ldapLookup($filter) {
        $ldap_host = "ldaps://ldapauth.umn.edu";
        $base_dn = "o=University of Minnesota,c=US";

		$connect = ldap_connect( $ldap_host);
		ldap_set_option($connect, LDAP_OPT_PROTOCOL_VERSION, 3);
		ldap_set_option($connect, LDAP_OPT_REFERRALS, 0);
        $r=ldap_bind($connect);
        $search = ldap_search([$connect], $base_dn, $filter, [], 0, 10)
        or exit(">>Unable to search ldap server<<");
        
        $returnArray = [];

        foreach($search as $readItem) {
            
            $info = ldap_get_entries($connect, $readItem);
            if($info["count"] == 0) {
                break;
            }
            foreach($info as $entry) {
                if(!isset($entry["umndid"])) {
                    continue;
                }
                if(isset($entry["umndisplaymail"][0])) {
                    $returnArray[] = ["full_name"=>$entry["displayname"][0], "mail"=>$entry["umndisplaymail"][0], "uid"=>$entry['uid'][0], "umndid"=>$entry["umndid"][0]];
                }
                
                
            }
        }
        return $returnArray;
    }

}
