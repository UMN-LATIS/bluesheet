<?php

namespace App\Library\TermPlan;

use Illuminate\Http\Request;

final class TermCode {
    /**
     * Throws ValidationException (422) unless `term` is a
     * four-digit code starting with 1 and ending in 3, 5,
     * or 9.
     */
    public static function fromRequest(Request $request): int {
        return (int) $request->validate([
            'term' => ['required', 'integer', 'regex:/^1\d\d[359]$/'],
        ])['term'];
    }
}
