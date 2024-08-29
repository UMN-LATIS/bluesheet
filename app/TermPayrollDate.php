<?php

namespace App;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TermPayrollDate extends Model
{
    use HasFactory;

    protected $fillable = [
        'term_code',
        'year',
        'semester',
        'payroll_start_date',
        'payroll_end_date',
    ];
}
