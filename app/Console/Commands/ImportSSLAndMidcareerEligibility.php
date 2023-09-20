<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class ImportSSLAndMidcareerEligibility extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'import:ssl {csvFile}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import SSL and MidCareer data';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $prompt = $this->confirm('You must clear any existing sabbatical and midcareer values before running this import. Have you done that?');
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
        $terms = $bandaid->getTerms();
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
            if($row['IS_ELIGIBLE_FOR_SINGLE_SEMESTER_LEAVE'] == '1') {
                $user->ssl_eligible = true;
            }
            if($row['IS_ELIGIBLE_FOR_TALLE_RESEARCH_AWARD'] == '1') {
                $user->midcareer_eligible = true;
            }
            if($row['IS_ELIGIBLE_TO_APPLY_FOR_SINGLE_SEMESTER_LEAVE'] == '1') {
                $user->ssl_apply_eligible = true;
            }
            $user->save();
            echo "Updated user with emplid: " . $emplId . "\n";
        }
        $this->info('Remember to notify ORGP!');
    }
}
