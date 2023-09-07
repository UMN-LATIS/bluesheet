<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Log;
class ImportLeaves extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'import:leaves';
    
    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import Leaves from Bandaid';

    private $userService = null;
    private $bandaid = null;

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $this->userService = new \App\Library\UserService();
        $this->bandaid = new \App\Library\Bandaid();
        $allDepartments = \App\Group::whereNotNull("dept_id")->get();
        foreach ($allDepartments as $department) {
            $employees = collect($this->bandaid->getEmployeesForDepartment($department->dept_id))->pluck("EMPLID");
            foreach($employees as $employee) {
                $this->importLeavesForEmplId($employee);
            }
        }
        return Command::SUCCESS;
    }

    public function importLeavesForEmplId($emplId) {
        $user = $this->userService->findOrCreateByEmplid($emplId);
        if(!$user) {
            return;
        }
        $leaves = $this->bandaid->getLeavesForEmployee($emplId);
        foreach($leaves as $importLeave) {
            $foundLeave = false;
            foreach($user->leavesIncludingTrashed as $existingLeave) {
                if($existingLeave->start_date == $importLeave->BEGIN_DATE && $existingLeave->end_date == $importLeave->END_DATE) {
                    $foundLeave = true;
                    break;
                }
            }

            if(!$foundLeave) {
                if($importLeave->BEGIN_DATE && $importLeave->END_DATE)
                { 
                    $leave = new \App\Leave();
                    $leave->start_date = $importLeave->BEGIN_DATE;
                    $leave->end_date = $importLeave->END_DATE;
                    $leave->synchronized_leave = true;
                    $leave->status = $leave::STATUS_CONFIRMED;
                    $leave->type = $leave::TYPE_OTHER;
                    $leave->description = "Imported Leave";
                    $user->leaves()->save($leave);
                    echo "Created leave for " . $user->emplid . " from " . $leave->start_date . " to " . $leave->end_date . "action" . $importLeave->ACTION . "\n";
                    $user->refresh();
                }

            }
        }

    }
}
