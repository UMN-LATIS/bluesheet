<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;
use Illuminate\Support\Facades\App;
class Kernel extends ConsoleKernel
{
    /**
     * The Artisan commands provided by your application.
     *
     * @var array
     */
    protected $commands = [
        //
    ];

    /**
     * Define the application's command schedule.
     *
     * @param  \Illuminate\Console\Scheduling\Schedule  $schedule
     * @return void
     */
    protected function schedule(Schedule $schedule)
    {
        $schedule->command('sync:users')
                 ->daily();
        
        $schedule->command('email:favorites')->dailyAt('08:30')->timezone('America/Chicago');;
        
        if (App::environment('production')) {
            // send a reminder email on the 10th of January and July.
            $schedule->command('email:periodicUpdate')
                ->when(function () {
                    return (
                        \Carbon\Carbon::now()->isSameDay($this->findSecondTuesdayOfMonth("January"))
                        ||
                        \Carbon\Carbon::now()->isSameDay($this->findSecondTuesdayOfMonth("July"))
                    );
                })->at('09:30')->timezone('America/Chicago');;    
        }
        
    }
    
    private function findSecondTuesdayOfMonth(string $month): object {
        return \Carbon\Carbon::parse("second tuesday of " . $month);
    }

    /**
     * Register the commands for the application.
     *
     * @return void
     */
    protected function commands()
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
