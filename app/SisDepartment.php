<?php

namespace App;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A department, keyed by the SIS department id that Bluesheet
 * groups store in dept_id.
 *
 * `campus` distinguishes Minneapolis from St. Paul, which have
 * different standard class meeting times.
 * @see https://policy.umn.edu/education/classscheduling-appe
 */
class SisDepartment extends Model {
    use HasFactory;

    protected $fillable = [
        'dept_id',
        'description',
        'college',
        'college_description',
        'zdept_id',
        'campus',
        'campus_description',
    ];

    public function appointments(): HasMany {
        return $this->hasMany(SisAppointment::class, 'dept_id', 'dept_id');
    }
}
