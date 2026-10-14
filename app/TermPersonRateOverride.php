<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use OwenIt\Auditing\Auditable as AuditableTrait;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

class TermPersonRateOverride extends Model implements AuditableContract {
    use AuditableTrait;

    protected $fillable = [
        'academic_org',
        'term_code',
        'emplid',
        'salary',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'academic_org' => 'integer',
        'term_code' => 'integer',
        'emplid' => 'integer',
        'salary' => 'float',
    ];
}
