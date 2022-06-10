<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class ParentOrganizationsTableSeeder extends Seeder
{

    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {
        

        \DB::table('parent_organizations')->delete();
        
        \DB::table('parent_organizations')->insert(array (
            0 => 
            array (
                'id' => 1,
                'group_title' => 'CLA',
                'parent_organization_id' => NULL,
            ),
        ));
        
        
    }
}