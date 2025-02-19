<?php

namespace App\Console\Commands;

use App\Library\UserService;
use Illuminate\Console\Command;
use App\TermPayrollDate;

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

        $prompt = $this->confirm('You must clear any existing eligibility values before running this import. Have you done that? This query is fine: delete from leaves where description = "Imported Sabbatical Eligibility" and type ="sabbatical" and status = "eligible" and `synchronized_leave`=1');
        if(!$prompt) {
            return;
        }
        $csvFile = $this->argument('csvFile');
        // open the csv 
        $fp = fopen($csvFile, 'r');
        // get the first row
        $header = fgetcsv($fp);
        $headings = [];
        foreach($header as $heading){

            // Remove any invalid or hidden characters
            $heading = preg_replace('/[\x00-\x1F\x80-\xFF]/', '', $heading);

            array_push($headings, $heading);
       }
        $this->userService = new \App\Library\UserService();
        $bandaid = new \App\Library\Bandaid();
        $terms = TermPayrollDate::all();
        while ($row = fgetcsv($fp)) {
            $all_rows[] = array_combine($headings, $row);
        }

        while($row = array_shift($all_rows)) {
            $emplId = $row['EMPLID'];
            if(!is_numeric($emplId)) {
                continue;
            }
            $user = $this->userService->findOrCreateByEmplid($emplId);
            if(!$user) {
                echo "Could not find user with emplid: " . $emplId . "\n";
                continue;
            }
            $startTerm = null;
            $endTerm = null;
            if(trim($row['PROJECTED_SABBATICAL_ELIGIBILITY_TERM']) != "") {
                // find the dates for the semester in the terms list
                $termYear = substr($row['PROJECTED_SABBATICAL_ELIGIBILITY_TERM'], 1, 2);
                $termSemester = substr($row['PROJECTED_SABBATICAL_ELIGIBILITY_TERM'], -1);
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
                    if($term->term_code == $row['PROJECTED_SABBATICAL_ELIGIBILITY_TERM']) {
                        $startTerm = $term;
                    }
                    if($term->term_code == $targetEndTerm) {
                        $endTerm = $term;
                    }
                }

                if($startTerm && $endTerm) {
                    $leave = new \App\Leave();
                    $leave->start_date = $startTerm->payroll_start_date;
                    $leave->end_date = $endTerm->payroll_end_date;
                    $leave->synchronized_leave = true;
                    $leave->type = \App\Leave::TYPE_SABBATICAL;
                    $leave->status = \App\Leave::STATUS_ELIGIBLE;
                    $leave->description ="Imported Sabbatical Eligibility";
                    $user->leaves()->save($leave);
                    echo "Added leave: " . $user->name . " " . $leave->start_date . " " . $leave->end_date . "\n";
                }
            }
        }
        $this->info('Remember to notify ORGP!');
    }
}
