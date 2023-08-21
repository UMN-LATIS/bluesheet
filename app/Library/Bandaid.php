<?php

namespace App\Library;

use GuzzleHttp\Client;
use Exception;
use RuntimeException;
use GuzzleHttp\Exception\RequestException;
use Illuminate\Support\Collection;
use Carbon\Carbon;


class Bandaid {
    private $client;
    public function __construct() {

        if (!config('bandaid.key')) {
            throw new \Exception('A CDL Token must be Specified');
        }

        $this->client = new Client([
            'headers' => [
                'Authorization' => 'Bearer ' . config('bandaid.key'),
            ],
            'base_uri' => 'https://cla-bandaid-prd-web.oit.umn.edu/api/',
        ]);
    }

    public function getDepartments(array $deptIds): array {
        try {
            $result = $this->client->get('department/?' . urldecode(http_build_query(["deptId" => $deptIds])));
            return json_decode($result->getBody());
        } catch (RequestException $e) {
            $msg = $e->getMessage();
            $errorMessage = 'getUserName Error: ' . $msg;
            throw new RuntimeException($errorMessage);
        }
    }

    public function getTerms(): array {
        try {
            $result = $this->client->get('classes/terms/');
            return json_decode($result->getBody());
        } catch (RequestException $e) {
            $msg = $e->getMessage();
            $errorMessage = 'getTerms Error: ' . $msg;
            throw new RuntimeException($errorMessage);
        }
    }

    /**
     * Get all academic terms for CLA (undergrad and grad) at the UMNTC
     */
    public function getCLATerms(): Collection {
        $allTerms = $this->getTerms();
        $sixMonthsFromNow = Carbon::now()->addMonths(6);

        // only return CLA terms
        return collect($allTerms)
            ->filter(function ($term) use ($sixMonthsFromNow) {
                return
                    //grad and ugrad have same terms
                    $term->ACADEMIC_CAREER === 'UGRD'
                    && $term->INSTITUTION === 'UMNTC'
                    && Carbon::parse($term->TERM_BEGIN_DT)->isBefore($sixMonthsFromNow);
            })->values();
    }

    public function getDeptScheduleForTerm(int $deptId, int $term): array {
        try {
            $result = $this->client->get('classes/list/' . $deptId . "/" . $term);
            return json_decode($result->getBody());
        } catch (RequestException $e) {
            $msg = $e->getMessage();
            $errorMessage = 'getDepartmentSchedule Error: ' . $msg;
            throw new RuntimeException($errorMessage);
        }
    }
}
