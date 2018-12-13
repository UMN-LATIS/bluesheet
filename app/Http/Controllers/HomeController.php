<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Auth;

class HomeController extends Controller
{
    public function index() {
    	$group = \App\Group::find(2);
    	$group->userCanEdit(Auth::user());
    	return view('home');
    }
}
