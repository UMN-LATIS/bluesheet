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
    public function testUserViewGroup()
    {
        $this->browse(function (Browser $browser) {
            $user = \App\User::where(["email"=>"mcfa0086@umn.edu"])->first();
            
            $browser->loginAs($user);
            $browser->visit('/')->assertSee("Colin");
            $browser->assertSee("LATIS");
            $browser->clickLink("LATIS");
            $browser->press("Show Email List");
            $browser->waitForText("list:")->assertSee("list:");

        });
    }
}
