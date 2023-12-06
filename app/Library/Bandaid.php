<?php

namespace App\Library;

use GuzzleHttp\Client;
use Exception;
use RuntimeException;
use GuzzleHttp\Exception\RequestException;
use Illuminate\Support\Collection;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Log;

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

    public function performRequest($url) {
        if ($value = Cache::get($url)) {
            return $value;
        } else {
            $result = $this->client->get($url);
            $value = json_decode($result->getBody());
            Cache::put($url, $value, 600);
            return $value;
        }
    }

    public function performPostRequest($url, $body) {
        if ($value = Cache::get(json_encode($body))) {
            return $value;
        } else {
            $result = $this->client->post($url, ['form_params' => $body]);
            $value = json_decode($result->getBody());
            if (!$value) {
                return [];
            }
            Cache::put(json_encode($body), $value, 600);
            return $value;
        }
    }

    public function getDepartments(array $deptIds): array {
        try {
            $result = $this->performRequest('department/?' . urldecode(http_build_query(["deptId" => $deptIds])));
            return $result;
        } catch (RequestException $e) {
            $msg = $e->getMessage();
            $errorMessage = 'getUserName Error: ' . $msg;
            throw new RuntimeException($errorMessage);
        }
    }

    public function getEmployees(array $emplIds): array {
        try {
            $result = $this->performPostRequest('employment/employees', ["emplids" => $emplIds]);
            return $result;
        } catch (RequestException $e) {
            $msg = $e->getMessage();
            $errorMessage = 'getEmployees Error: ' . $msg;
            throw new RuntimeException($errorMessage);
        }
    }

    public function getEmployeesForDepartment($deptId): array {
        try {
            $result = $this->performRequest('department/' . $deptId . '/employees');
            return $result;
        } catch (RequestException $e) {
            $msg = $e->getMessage();
            $errorMessage = 'getEmployees Error: ' . $msg;
            throw new RuntimeException($errorMessage);
        }
    }

    public function getLeavesForEmployee($emplId): array {
        try {
            $result = $this->performRequest('employment/leaves/' . $emplId);
            return $result;
        } catch (RequestException $e) {
            $msg = $e->getMessage();
            $errorMessage = 'getLeaves Error: ' . $msg;
            throw new RuntimeException($errorMessage);
        }
    }

    public function getTerms(): array {
        try {
            $result = $this->performRequest('classes/terms/');
            return $result;
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

        // only return CLA terms
        return collect($allTerms)
            ->filter(function ($term) {
                return
                    //grad and ugrad have same terms, so just get UGRD
                    $term->ACADEMIC_CAREER === 'UGRD'
                    && $term->INSTITUTION === 'UMNTC';
            })->values();
    }

    public function getDeptClassList(int $deptId): array {
        try {
            $result = $this->performRequest('classes/list/' . $deptId);
            return $result;
        } catch (RequestException $e) {
            $msg = $e->getMessage();
            $errorMessage = 'getDeptCourses Error: ' . $msg;
            throw new RuntimeException($errorMessage);
        }
    }

    public function getDeptScheduleForTerm(int $deptId, int $term): array {
        try {
            $result = $this->performRequest('classes/list/' . $deptId . "/" . $term);
            return $result;
        } catch (RequestException $e) {
            $msg = $e->getMessage();
            $errorMessage = 'getDepartmentSchedule Error: ' . $msg;
            throw new RuntimeException($errorMessage);
        }
    }

    public function getTermsOverlappingDates($startDate, $endDate) {
        $terms = $this->getCLATerms();
        return $terms->filter(function ($term) use ($startDate, $endDate) {
            $termStartDate = $term->TERM_BEGIN_DT;
            $termEndDate = $term->TERM_END_DT;

            // is term start or end between the leave start and end dates?
            $isTermStartInRange = ($startDate <= $termStartDate && $termStartDate <= $endDate);

            $isTermEndInRange = ($startDate <= $termEndDate && $termEndDate <= $endDate);

            return ($isTermStartInRange || $isTermEndInRange);
        });
    }
}
