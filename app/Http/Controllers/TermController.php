<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Library\Bandaid;
use App\Http\Resources\TermResource;
use Illuminate\Support\Carbon;
use App\TermPayrollDate;

class TermController extends Controller {
    protected $bandaid;

    public function __construct(Bandaid $bandaid) {
        $this->bandaid = $bandaid;
    }

    public function index(Request $request) {
        abort_unless($request->user(), 401);

        $MAX_YEARS_IN_FUTURE = 3;

        $terms = $this->bandaid->getCLATerms()->filter(function ($term) use ($MAX_YEARS_IN_FUTURE) {
            // ignore terms that are more than
            // 3 years in the future
            $termStartDate = Carbon::parse($term->TERM_BEGIN_DT);
            return $termStartDate->isBefore(now()->addYears($MAX_YEARS_IN_FUTURE));
        });

        return TermResource::collection($terms);
    }

    public function payrollDates() {
        return TermPayrollDate::all();
    }
}
