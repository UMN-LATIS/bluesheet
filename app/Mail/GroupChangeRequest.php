<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use App\Group;
use App\User;

class GroupChangeRequest extends Mailable
{
    use Queueable, SerializesModels;

    public $group;
    public $description;
    public $requestingUser;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct(Group $group, $description, User $requestingUser)
    {
        $this->group = $group;
        $this->description = $description;
        $this->requestingUser = $requestingUser;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        return $this->from("latistecharch@umn.edu", "LATIS Technology Architecture")
                    ->subject("CLA BlueSheet Change Request - " . $this->group->group_title)
                    ->view('email.groupChangeRequest', [
                        'group' => $this->group,
                        'description' => $this->description,
                        'requestingUser' => $this->requestingUser
                    ]);
    }
}
