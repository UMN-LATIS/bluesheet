<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class TestGroupsUsersTableSeeder extends Seeder
{

    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {
        

        \DB::table('users')->delete();
        
        \DB::table('users')->insert(array (
            0 => 
            array (
                'id' => 1,
                'givenname' => 'Admin',
                'surname' => 'McAdmin',
                'displayName' => 'Admin User',
                'email' => 'admin@umn.edu',
                'umndid' => 'admin',
                'office' => NULL,
                'phone' => NULL,
                'remember_token' => NULL,
                'created_at' => '2022-03-14 18:37:33',
                'updated_at' => '2022-03-14 18:37:33',
                'deleted_at' => NULL,
                'ou' => NULL,
                'title' => NULL,
                'emplid' => NULL,
                'seen_tour' => 1,
                'send_email_reminders' => 1,
                'notify_of_favorite_changes' => 0,
            ),
        ));
        
        
    }
}