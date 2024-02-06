<?php

use function Pest\Laravel\get;

it('gets a response from the homepage', function () {
    // home page should redirect to login page
    get('/')->assertStatus(302);
});
