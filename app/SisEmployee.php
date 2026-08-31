<?php

namespace App;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A person in the SIS
 */
class SisEmployee extends Model {
    use HasFactory;

    protected $fillable = [
        'emplid',
        'full_name',
        'first_name',
        'last_name',
        'internet_id',
        'umndid',
    ];

    protected $casts = [
        'emplid' => 'integer',
    ];

    public function appointments(): HasMany {
        return $this->hasMany(SisAppointment::class, 'emplid', 'emplid');
    }

    public function classInstructors(): HasMany {
        return $this->hasMany(SisClassInstructor::class, 'emplid', 'emplid');
    }
}
