<?php

namespace App\Http\Controllers;

use App\Leave;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Http\Response;
use Auth;
use App\Http\Resources\LeaveResource;
use App\Library\Bandaid;

class LeaveController extends Controller {
    protected $bandaid;
    protected $userService;

    public function __construct(Bandaid $bandaid) {
        $this->bandaid = $bandaid;
    }


    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request) {
        $this->authorize('viewAny', Leave::class);

        $leaves = Leave::with('user')->paginate(500);

        // append term data
        $leavesWithTerms = collect($leaves->items())
            ->map(function ($leave) {
                $leave->terms = $this->bandaid->getTermsOverlappingDates($leave->start_date, $leave->end_date);

                return $leave;
            })
            ->filter(function ($leave) {
                // if terms are empty then the leave
                // can be ignored
                return $leave['terms']->isNotEmpty();
            });

        return LeaveResource::collection($leavesWithTerms);
    }


    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request) {
        abort_if($request->user()->cannot('edit leaves'), 403);

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
        $currentUser = Auth::user();
        abort_if($currentUser->cannot('view leave') && $leave->user_id !== $currentUser->id, 403);

        return $leave->load(['user', 'artifacts']);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Leave  $leave
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, Leave $leave) {
        abort_if($request->user()->cannot('edit leaves'), 403);

        $validated = $request->validate([
            'user_id' => 'required|integer|exists:users,id',
            'description' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'status' => ['required', Rule::in(Leave::STATUSES)],
            'type' => ['required', Rule::in(Leave::TYPES)],
        ]);

        $leave->update($validated);

        return $leave->load(['user', 'artifacts']);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  \App\Leave  $leave
     * @return \Illuminate\Http\Response
     */
    public function destroy(Request $request, Leave $leave) {
        abort_if($request->user()->cannot('edit leaves'), 403);

        $leave->delete();
        return response()->json(null, Response::HTTP_NO_CONTENT);
    }
}
