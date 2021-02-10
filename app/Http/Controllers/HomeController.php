<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Auth;

class HomeController extends Controller
{
    public function index() {
        $showTour = false;
        if(!Auth::user()->seen_tour) {
            $showTour = true;
            Auth::user()->seen_tour = true;
            Auth::user()->save();
        }
    	return view('home', compact('showTour'));
    }
}
