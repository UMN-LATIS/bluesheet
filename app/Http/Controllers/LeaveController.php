<?php

namespace App\Http\Controllers;

use App\Leave;
use App\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Http\Response;
use Auth;
use App\Http\Resources\LeaveResource;
use App\Library\Bandaid;
use App\TermPayrollDate;

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

        $leaves = Leave::with('user')->get();

        $emplids = $leaves
            ->map(fn ($leave) => $leave->user->emplid)
            ->unique()
            ->filter();

        $employees = $this->bandaid->getEmployees($emplids->toArray());
        $employeeLookup = collect($employees)->keyBy("EMPLID");

        $leaves
            ->each(function ($leave) use ($employeeLookup) {

                // append terms
                $leave->terms = $this->bandaid->getTermsOverlappingDates($leave->start_date, $leave->end_date);


                // append user's dept_id, if available
                $emplid = $leave->user->emplid;
                if (!$emplid) {
                    return;
                }

                $leave->user->deptId = (int) $employeeLookup->get($emplid)?->DEPTID ?? null;
            })
            ->filter(function ($leave) {
                // if terms are empty then the leave
                // can be ignored
                return $leave['terms']->isNotEmpty();
            });

        return LeaveResource::collection($leaves);
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

        $leaveOwner = User::find($validated['user_id']);

        $this->authorize('modifyLeavesForUser', [Leave::class, $leaveOwner]);


        $leave = Leave::create($validated);
        return LeaveResource::make($leave->load('user'));
    }

    /**
     * Display the specified resource.
     *
     * @param  \App\Leave  $leave
     * @return \Illuminate\Http\Response
     */
    public function show(Leave $leave) {
        $this->authorize('view', $leave);

        return LeaveResource::make($leave->load(['user', 'artifacts']));
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Leave  $leave
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, Leave $leave) {
        $this->authorize('update', $leave);

        $validated = $request->validate([
            'user_id' => 'required|integer|exists:users,id',
            'description' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'status' => ['required', Rule::in(Leave::STATUSES)],
            'type' => ['required', Rule::in(Leave::TYPES)],
        ]);

        $leave->update($validated);

        return LeaveResource::make($leave->load(['user', 'artifacts']));
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  \App\Leave  $leave
     * @return \Illuminate\Http\Response
     */
    public function destroy(Request $request, Leave $leave) {
        $this->authorize('delete', $leave);

        $leave->delete();
        return response()->json(null, Response::HTTP_NO_CONTENT);
    }
}
