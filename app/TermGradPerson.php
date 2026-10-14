<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use OwenIt\Auditing\Auditable as AuditableTrait;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

class TermGradPerson extends Model implements AuditableContract {
    use AuditableTrait;

    protected $fillable = [
        'academic_org',
        'term_code',
        'emplid',
        'has_fee_offset',
        'is_international',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'academic_org' => 'integer',
        'term_code' => 'integer',
        'emplid' => 'integer',
        'has_fee_offset' => 'boolean',
        'is_international' => 'boolean',
    ];
}
