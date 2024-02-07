<?php

namespace Database\Factories;

use App\CourseSection;
use App\Group;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\CourseSection>
 */
class CourseSectionFactory extends Factory {
    protected $model = CourseSection::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array {

        $classSectionNum = $this->faker->numberBetween(1, 10);
        $classSectionPadded = str_pad($classSectionNum, 3, '0', STR_PAD_LEFT);

        return [
            'course_id' => join('-', [
                'FAKE', $this->faker->numberBetween(1000, 9999)
            ]),
            'term_id' => $this->faker->numberBetween(1000, 9999),
            'group_id' => Group::factory(),
            'class_section' => $classSectionPadded,
            'is_published' => false,
            'is_cancelled' => false,
        ];
    }
}
