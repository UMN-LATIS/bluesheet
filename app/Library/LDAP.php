<?php

namespace App\Library;


class LDAP
{

    public static function lookupUserCached($lookupValue, $lookupType = "uid") {
        $ldap = cache()->remember(
            "ldap-lookup-$lookupType-$lookupValue",
            now()->addHours(6),
            function () use ($lookupValue, $lookupType) {
                $data = self::lookupUser($lookupValue, $lookupType);

                // this is a workaround so that null values can be cached
                // if we return null directly, Laravel will interpret that
                // as a cache miss
                return ['data' => $data];
            }
        );
        return $ldap['data'];
    }

	public static function lookupUser($lookupValue, $lookupType="uid", $existingUser =null) {
		$connect = LDAP::getConnection();
        if(!$connect) {
            return null;
        }
        $base_dn = array("o=University of Minnesota, c=US",);
        $filter = "(" . $lookupType . "=" . $lookupValue . ")";
        $search = ldap_search([$connect], $base_dn, $filter);
        $foundUser = null;
        foreach($search as $readItem) {

            $info = ldap_get_entries($connect, $readItem);
            if(!isset($info[0]["umndid"])) {
                continue;
            }
            if($existingUser) {
                $foundUser = $existingUser;
            }
            else {
                $foundUser = new \App\User;
                $foundUser->assignRole("basic user");
                $foundUser->assignRole("view user");
            }

            $foundUser->umndid = isset($info[0]["umndid"])?$info[0]["umndid"][0]:"";
            $foundUser->surname = isset($info[0]["sn"])?$info[0]["sn"][0]:"";
            $foundUser->givenname = isset($info[0]["givenname"])?$info[0]["givenname"][0]:"";
            $foundUser->displayName =isset( $info[0]["displayname"])?$info[0]["displayname"][0]:"";
            $foundUser->email =isset( $info[0]["mail"])?$info[0]["mail"][0]:"";
            $foundUser->office = isset($info[0]["umnofficeaddress1"])?$info[0]["umnofficeaddress1"][0]:"";
            $foundUser->title = isset($info[0]["title"])?$info[0]["title"][0]:"";
            $foundUser->emplid = isset($info[0]["umnemplid"])?$info[0]["umnemplid"][0]:"";
            $foundUser->ou = isset($info[0]["ou"])?$info[0]["ou"][0]:"";
            $foundUser->emplid = isset($info[0]["umnemplid"])?$info[0]["umnemplid"][0]:null;

            break;
        }


        return $foundUser;
	}

    public static function userSearch($lookupValue, $lookupType="uid") {
        $connect = LDAP::getConnection();
        if(!$connect) {
            return [];
        }
        $base_dn = array("o=University of Minnesota, c=US",);
        $filter = "(" . $lookupType . "=" . $lookupValue . ")";
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

    private static function getConnection() {
        putenv('LDAPTLS_REQCERT=never');
        $connect = ldap_connect( 'ldaps://ldapauth.umn.edu', 636);
        ldap_set_option($connect, LDAP_OPT_PROTOCOL_VERSION, 3);
        ldap_set_option($connect, LDAP_OPT_REFERRALS, 0);
        if(!config("ldap.username") || !config("ldap.password")) {
            return null;
        }
        $r=ldap_bind($connect, 'cn=' . config("ldap.username") . ',ou=Organizations,o=University of Minnesota,c=US', config("ldap.password"));
        return $connect;
    }

}
