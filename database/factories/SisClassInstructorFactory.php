<?php

namespace Database\Factories;

use App\SisClassInstructor;
use App\SisClassSection;
use App\SisEmployee;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\SisClassInstructor>
 */
class SisClassInstructorFactory extends Factory {
    protected $model = SisClassInstructor::class;

    public function definition() {
        return [
            'sis_class_section_id' => SisClassSection::factory(),
            // emplid points at the employee's business key, not its id
            'emplid' => fn() => SisEmployee::factory()->create()->emplid,
            'role' => 'PI',
        ];
    }
}
