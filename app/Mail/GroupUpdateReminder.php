<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class GroupUpdateReminder extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $tries = 3;

    public $backoff = [60, 300, 900];

    public $timeout = 120;

    public $userGroups;
    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct(\Illuminate\Support\Collection $groups)
    {
        $this->userGroups = $groups;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        return $this->from("latistecharch@umn.edu", "LATIS Technology Architecture")->subject("CLA BlueSheet Update Reminder")->view('email.updateReminder', ["groups"=>$this->userGroups]);
    }
}
