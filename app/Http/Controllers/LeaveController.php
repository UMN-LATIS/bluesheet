<?php

namespace App\Http\Controllers;

use App\Leave;
use App\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LeaveController extends Controller {
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index() {
        $leaves = Leave::with('user')->paginate(50);
        return $leaves;
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request) {
        $validated = $request->validate([
            'user_id' => 'required|integer|exists:users,id',
            'description' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'status' => ['required', Rule::in(Leave::STATUSES)],
            'type' => ['required', Rule::in(Leave::TYPES)],
        ]);

        $leave = Leave::create($validated);
        return $leave->load('user');
    }

    /**
     * Display the specified resource.
     *
     * @param  \App\Leave  $leave
     * @return \Illuminate\Http\Response
     */
    public function show(Leave $leave) {
        return $leave->load('user');
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Leave  $leave
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, Leave $leave) {
        //
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  \App\Leave  $leave
     * @return \Illuminate\Http\Response
     */
    public function destroy(Leave $leave) {
        //
    }
}