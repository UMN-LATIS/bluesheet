<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\User;
use App\Leave;
use Auth;

class UserLeaveController extends Controller {
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index(User $user) {
        $currentUser = Auth::user();
        abort_if($currentUser->cannot('view leaves') && $currentUser->id !== $user->id, 403);

        return Leave::where('user_id', $user->id)->paginate(50);
    }

    public function update(User $user) {
        $currentUser = Auth::user();
        abort_if($currentUser->cannot('edit leaves'), 403);

        $validatedLeaves = request()->validate([
            'leaves' => 'array', // could be empty
            // id is nullable for new leaves
            'leaves.*.id' => 'nullable|integer',
            'leaves.*.description' => 'required|string|max:255',
            'leaves.*.start_date' => 'required|date',
            'leaves.*.end_date' => 'required|date|after:start_date',
            'leaves.*.status' => ['required', Rule::in(Leave::STATUSES)],
            'leaves.*.type' => ['required', Rule::in(Leave::TYPES)],
            'leaves.*.user_id' => 'required|integer|exists:users,id',
        ]);

        $leaveIdsToKeep = [];

        foreach ($validatedLeaves['leaves'] as $leaveData) {
            abort_if($leaveData['user_id'] !== $user->id, 422);

            // If there's an ID, try to update the leave
            if (isset($leaveData['id'])) {
                $leave = Leave::find($leaveData['id']);
                if ($leave) {
                    $leave->update($leaveData);
                    $leaveIdsToKeep[] = $leave->id;
                    continue;
                }
            }

            // If there's no ID or leave was not found, create a new one
            $leave = Leave::create($leaveData);
            $leaveIdsToKeep[] = $leave->id;
        }

        // Soft delete leaves not in the request
        Leave::where('user_id', $user->id)
            ->whereNotIn('id', $leaveIdsToKeep)
            ->delete();

        return response()->json([
            'message' => 'Leaves updated successfully.',
            'leaves' => Leave::where('user_id', $user->id)->get(),
        ], 200);
    }
}
