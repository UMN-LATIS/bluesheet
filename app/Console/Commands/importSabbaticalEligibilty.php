<?php

namespace App\Console\Commands;

use App\Library\UserService;
use Illuminate\Console\Command;

class ImportSabbaticalEligibilty extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'import:sabbatical {csvFile}';
    
    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import sabbatical eligibility from spreadsheet';


    private $userService = null;

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $csvFile = $this->argument('csvFile');
        // open the csv 
        $fp = fopen($csvFile, 'r');
        // get the first row
        $header = fgetcsv($fp);
        $this->userService = new \App\Library\UserService();
        $bandaid = new \App\Library\Bandaid();
        $terms = $bandaid->getTerms();

        while($row = fgetcsv($fp)) {
            $emplId = $row[0];
            $user = $this->userService->findOrCreateByEmplid($emplId);
            if(!$user) {
                echo "Could not find user with emplid: " . $emplId . "\n";
                continue;
            }
            $startTerm = null;
            $endTerm = null;
            if(trim($row[1]) != "") {
                // find the dates for the semester in the terms list
                $termYear = substr($row[1], 1, 2);
                $termSemester = substr($row[1], -1);
                if($termSemester == 9) {
                    $nextTerm = 3;
                    $termYear = intval($termYear) + 1;
                }
                if($termSemester ==3 ){
                    $nextTerm = 9;
                }
                $targetEndTerm = 1 . $termYear . $nextTerm;
                echo $targetEndTerm . "\n";
                foreach($terms as $term) {
                    if($term->TERM == $row[1] && $term->INSTITUTION == "UMNTC" && $term->ACADEMIC_CAREER == "UGRD") {
                        $startTerm = $term;
                    }
                    if($term->TERM == $targetEndTerm && $term->INSTITUTION == "UMNTC" && $term->ACADEMIC_CAREER == "UGRD") {
                        $endTerm = $term;
                    }
                }

                if($startTerm && $endTerm) {
                    $leave = new \App\Leave();
                    $leave->start_date = $startTerm->TERM_BEGIN_DT;
                    $leave->end_date = $endTerm->TERM_END_DT;
                    $leave->synchronized_leave = true;
                    $leave->type = \App\Leave::TYPE_SABBATICAL;
                    $leave->status = \App\Leave::STATUS_ELIGIBLE;
                    $leave->description ="Imported Sabbatical Eligibility";
                    $user->leaves()->save($leave);
                    echo "Added leave: " . $user->name . " " . $leave->start_date . " " . $leave->end_date . "\n";
                }
            }
        }

    }
}
