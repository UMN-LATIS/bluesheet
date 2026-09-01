<?php

namespace App\Http\Controllers\Sis;

use App\Http\Controllers\Controller;
use App\Http\Resources\Sis\SisTermResource;
use App\SisTerm;

class TermController extends Controller {
    /**
     * Every term the SIS has told us about, most recent first.
     *
     * One term code yields a row per academic career, all with the same
     * name but differing dates, so the undergraduate row stands for the
     * term. Graduate shares its dates; medicine, which does not, is a
     * knowing omission.
     */
    public function index() {
        $terms = SisTerm::undergrad()
            ->orderByDesc('term_code')
            ->get();

        return SisTermResource::collection($terms);
    }
}
