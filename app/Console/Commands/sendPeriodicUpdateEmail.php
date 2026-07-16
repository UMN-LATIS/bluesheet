<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Throwable;

class sendPeriodicUpdateEmail extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'email:periodicUpdate';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send Periodic Updates';

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $processed = 0;
        $queued = 0;
        $sent = 0;
        $skippedNoEmail = 0;
        $skippedInvalidEmail = 0;
        $failed = 0;

        \App\User::where("send_email_reminders", 1)
            ->chunkById(200, function ($users) use (&$processed, &$queued, &$sent, &$skippedNoEmail, &$skippedInvalidEmail, &$failed) {
                foreach ($users as $user) {
                    $processed++;

                    $email = trim((string) $user->email);
                    if ($email === '') {
                        $skippedNoEmail++;
                        continue;
                    }

                    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                        $skippedInvalidEmail++;
                        Log::warning('Skipping periodic update reminder due to invalid email.', [
                            'user_id' => $user->id,
                            'email' => $email,
                        ]);
                        continue;
                    }

                    $userGroups = $user->groups->filter(function ($group) use ($user) {
                        $activeMembers = $group->activeMembers->filter(function ($member) use ($user) {
                            return $member->user->id == $user->id;
                        });
                        $adminRoles = $activeMembers->filter(function ($member) {
                            return $member->admin;
                        });
                        return $adminRoles->count() > 0;
                    });

                    // Only send reminders for groups where the user is an admin.
                    if ($userGroups->count() === 0) {
                        continue;
                    }

                    $uniqueGroups = $userGroups->unique('id');

                    try {
                        Mail::to($email)->queue(new \App\Mail\GroupUpdateReminder($uniqueGroups));
                        $queued++;
                    } catch (Throwable $queueException) {
                        Log::warning('Queueing periodic update reminder failed. Falling back to direct send.', [
                            'user_id' => $user->id,
                            'email' => $email,
                            'error' => $queueException->getMessage(),
                        ]);

                        try {
                            Mail::to($email)->sendNow(new \App\Mail\GroupUpdateReminder($uniqueGroups));
                            $sent++;
                        } catch (Throwable $sendException) {
                            $failed++;
                            Log::error('Sending periodic update reminder failed.', [
                                'user_id' => $user->id,
                                'email' => $email,
                                'error' => $sendException->getMessage(),
                            ]);
                        }
                    }
                }
            });

        $this->info(sprintf(
            'Periodic update reminders processed=%d queued=%d sent=%d skipped_no_email=%d skipped_invalid_email=%d failed=%d',
            $processed,
            $queued,
            $sent,
            $skippedNoEmail,
            $skippedInvalidEmail,
            $failed
        ));

        return self::SUCCESS;
    }
}
