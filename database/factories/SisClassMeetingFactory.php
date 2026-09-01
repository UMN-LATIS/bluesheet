<?php

namespace Database\Factories;

use App\SisClassMeeting;
use App\SisClassSection;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\SisClassMeeting>
 */
class SisClassMeetingFactory extends Factory {
    protected $model = SisClassMeeting::class;

    public function definition() {
        return [
            'sis_class_section_id' => SisClassSection::factory(),
            'starts_at' => '10:10:00',
            'ends_at' => '11:25:00',
            'meets_monday' => true,
            'meets_tuesday' => false,
            'meets_wednesday' => true,
            'meets_thursday' => false,
            'meets_friday' => false,
            'meets_saturday' => false,
            'meets_sunday' => false,
        ];
    }

    /** A meeting the SIS has not scheduled a time for. */
    public function withoutTimes(): static {
        return $this->state([
            'starts_at' => null,
            'ends_at' => null,
        ]);
    }
}
