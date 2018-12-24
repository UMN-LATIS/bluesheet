<?php

namespace Tests\Browser;

use Tests\DuskTestCase;
use Laravel\Dusk\Browser;
use Illuminate\Foundation\Testing\DatabaseMigrations;

class BasicUserTest extends DuskTestCase
{
    /**
     * A Dusk test example.
     *
     * @return void
     */
    public function userViewGroup()
    {
        $this->browse(function (Browser $browser) {
            $user = \App\User::where(["email"=>"test@umn.edu"])->first();
            
            $browser->loginAs($user);
            $browser->visit('/')->assertSee("Test User");
            $browser->assertSee("Test Group");
            $browser->clickLink("Test Group");
            $browser->press("Show Email List");
            $browser->assertSee("Email list");

        });
    }
}
