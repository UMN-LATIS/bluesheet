<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class TestGroupsGroupTypesTableSeeder extends Seeder
{

    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('group_types')->insert(array (
            0 =>
            array (
                'id' => 1,
                'label' => 'Committee',
            ),
            1 =>
            array (
                'id' => 2,
                'label' => 'List',
            ),
            2 =>
            array (
                'id' => 3,
                'label' => 'Academic Department',
            ),
            3 =>
            array (
                'id' => 4,
                'label' => 'Fun Time',
            ),
            4 =>
            array (
                'id' => 5,
                'label' => 'Center',
            ),
            5 =>
            array (
                'id' => 6,
                'label' => 'Initiative',
            ),
            6 =>
            array (
                'id' => 7,
                'label' => 'Consortium',
            ),
            7 =>
            array (
                'id' => 8,
                'label' => 'Program',
            ),
            8 =>
            array (
                'id' => 9,
                'label' => 'Administrative Unit',
            ),
            9 =>
            array (
                'id' => 10,
                'label' => 'Department',
            ),
        ));


    }
}
