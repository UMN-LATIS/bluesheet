<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class TestGroupsOfficialRoleCategoriesTableSeeder extends Seeder
{

    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {
        

        \DB::table('official_role_categories')->delete();
        
        \DB::table('official_role_categories')->insert(array (
            0 => 
            array (
                'id' => 1,
                'category' => 'Unit',
            ),
            1 => 
            array (
                'id' => 2,
                'category' => 'College',
            ),
            2 => 
            array (
                'id' => 3,
                'category' => 'Operations',
            ),
        ));
        
        
    }
}