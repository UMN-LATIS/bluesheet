<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\Response;
use App\LeaveArtifact;
use App\Leave;
use Auth;


class LeaveArtifactController extends Controller {
    public function index(Request $request, Leave $leave) {
        abort_if($request->user()->cannot('view leaves') && $leave->user_id !== Auth::user()->id, 403);

        return $leave->artifacts;
    }

    public function show(Request $request, Leave $leave, LeaveArtifact $leaveArtifact) {
        abort_if($request->user()->cannot('view leaves') && $leave->user_id !== Auth::user()->id, 403);

        return $leaveArtifact;
    }

    public function store(Request $request, Leave $leave) {
        abort_if($request->user()->cannot('edit leaves'), 403);

        $validated = $request->validate([
            'label' => 'required|string',
            'target' => 'required|string',
        ]);

        return $leave->artifacts()->create($validated);
    }

    public function update(Request $request, Leave $leave, LeaveArtifact $leaveArtifact) {
        abort_if($request->user()->cannot('edit leaves'), 403);

        $validated = $request->validate([
            'label' => 'required|string',
            'target' => 'required|string',
        ]);

        $updateSuccessful = $leaveArtifact->update($validated);

        if (!$updateSuccessful) {
            return response()->json(['message' => 'Could not update artifact'], 500);
        } else {
            return $leaveArtifact->refresh();
        }
    }

    public function destroy(Request $request, Leave $leave, LeaveArtifact $leaveArtifact) {
        abort_if($request->user()->cannot('edit leaves'), 403);

        $leaveArtifact->delete();

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }
}
