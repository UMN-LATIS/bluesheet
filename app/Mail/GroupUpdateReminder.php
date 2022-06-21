<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class GroupUpdateReminder extends Mailable
{
    use Queueable, SerializesModels;
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
