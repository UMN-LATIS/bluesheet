<?php

namespace App\Http\Controllers;

use App\TermPayrollDate;

class TermController extends Controller {
    public function payrollDates() {
        return TermPayrollDate::all();
    }
}
