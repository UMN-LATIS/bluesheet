<?php

namespace App\Http\Controllers\CoursePlanning;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Library\Bandaid;
use App\Http\Resources\TermResource;

class TermController extends Controller {
    protected $bandaid;

    public function __construct(Bandaid $bandaid) {
        $this->bandaid = $bandaid;
    }

    public function index(Request $request) {
        abort_if($request->user()->cannot('view planned courses'), 403);

        $terms = $this->bandaid->getCLATerms();

        return TermResource::collection($terms);
    }
}
