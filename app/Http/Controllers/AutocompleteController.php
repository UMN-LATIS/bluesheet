<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use DB;
use Auth;
use App\Library\LDAP as LDAP;


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
        
        
        
        

        $returnArray = LDAP::userSearch($searchString, $field);

        if($mergedSearch) {
            $userDiscovery = LDAP::userSearch($searchValue, "uid");
            if(count($userDiscovery) > 0) {
                \array_unshift($returnArray, $userDiscovery[0]);
            }
        }

        $returnArray = array_values(array_intersect_key($returnArray, array_unique(array_column($returnArray, 'umndid'))));

        return response()->json(["items" => $returnArray]);
        
        
        
    }

}
