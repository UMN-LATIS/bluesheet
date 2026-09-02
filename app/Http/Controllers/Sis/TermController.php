<?php

namespace App\Http\Controllers\Sis;

use App\Http\Controllers\Controller;
use App\Http\Resources\Sis\SisTermResource;
use App\SisTerm;

class TermController extends Controller {
    /**
     * One row per term code: the SIS has one per academic career, and the
     * undergraduate row stands for the term.
     */
    public function index() {
        $terms = SisTerm::undergrad()
            ->orderByDesc('term_code')
            ->get();

        return SisTermResource::collection($terms);
    }
}
