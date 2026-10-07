<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use OwenIt\Auditing\Auditable as AuditableTrait;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

class TermCostSetting extends Model implements AuditableContract {
    use AuditableTrait;

    protected $fillable = [
        'academic_org',
        'fiscal_year',
        'key',
        'value',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'academic_org' => 'integer',
        'fiscal_year' => 'integer',
    ];
}
