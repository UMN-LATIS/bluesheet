<?php

namespace App\Library;


class LDAP
{

	public static function lookupUser($lookupValue, $lookupType="cn") {
		putenv('LDAPTLS_REQCERT=never');
        $connect = ldap_connect( 'ldaps://ldap-dsee.oit.umn.edu', 636);
        $base_dn = array("o=University of Minnesota, c=US",);
        ldap_set_option($connect, LDAP_OPT_PROTOCOL_VERSION, 3);
        ldap_set_option($connect, LDAP_OPT_REFERRALS, 0);
        $r=ldap_bind($connect);

        $filter = "(" . $lookupType . "=" . $lookupValue . ")";
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
            $foundUser->ou = isset($info[0]["ou"])?$info[0]["ou"][0]:"";
            $foundUser->site_permissions = 100;
            break;
        }
        return $foundUser;
	}

}