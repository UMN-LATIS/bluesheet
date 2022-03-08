<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Carbon\Carbon;

class ChangedFavoriteNotification extends Mailable
{
    use Queueable, SerializesModels;
    public $changes;
    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct($changes)
    {
        $this->changes = $changes;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        return $this->from("latistecharch@umn.edu", "LATIS Technology Architecture")->subject("CLA BlueSheet Favorites have Changed")->view('email.favoritesUpdated', ["changes"=>$this->changes]);
    }
}
