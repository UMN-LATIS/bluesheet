<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use \App\Library\Bandaid;

class LookupController extends Controller
{
    public function departmentInfo(Request $req, $deptId=null)
    {
        if(!$deptId) {
            $deptId = $req->get("deptId");
        }

        if(!is_array($deptId)) {
            $deptId = [$deptId];
        }

        $bandaid = new Bandaid();
        $result = $bandaid->getDepartments($deptId);
        return Response()->json($result);

    }
}
