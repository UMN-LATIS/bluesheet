<?php

namespace Database\Factories;

use App\LocalClassMeeting;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\LocalClassMeeting>
 */
class LocalClassMeetingFactory extends Factory {
    protected $model = LocalClassMeeting::class;

    public function definition() {
        return [
            'starts_at' => '10:10:00',
            'ends_at' => '11:00:00',
            'meets_monday' => true,
            'meets_wednesday' => true,
            'meets_friday' => true,
        ];
    }
}
