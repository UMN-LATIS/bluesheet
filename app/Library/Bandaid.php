<?php

namespace App\Library;

use RuntimeException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Collection;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class Bandaid {
    private $baseUri;
    private $headers;

    public function __construct() {
        if (!config('bandaid.key')) {
            throw new \Exception('A CDL Token must be Specified');
        }

        $this->headers = [
            'Authorization' => 'Bearer ' . config('bandaid.key'),
        ];


        Http::globalOptions([
            'allow_redirects' => false,
        ]);

        $this->baseUri = config('bandaid.baseUri');
    }

    public function cachedGet($url) {
        if ($value = Cache::get($url)) {
            return $value;
        }

        $response = Http::withHeaders($this->headers)->get($this->baseUri . $url);

        $value = json_decode($response->body());

        Cache::put($url, $value, 600);
        return $value;
    }

    public function cachedPost($url, $body) {
        $cacheKey = $url . "_" . json_encode($body);
        $cachedValue = Cache::get($cacheKey);
        if ($cachedValue) {
            return $cachedValue;
        }

        $response = Http::withHeaders($this->headers)
            ->post(
                $this->baseUri . $url,
                $body
            );

        $value = json_decode($response->body());
        Cache::put($cacheKey, $value, 600);
        return $value;
    }

    public function getDepartments(array $deptIds): array {
        try {
            $result = $this->cachedGet(
                '/department?' . urldecode(http_build_query(["deptId" => $deptIds]))
            );
            return $result;
        } catch (RequestException $e) {
            $msg = $e->getMessage();
            $errorMessage = 'getUserName Error: ' . $msg;
            throw new RuntimeException($errorMessage);
        }
    }

    public function getEmployees(array $emplIds): array {
        if (empty($emplIds)) {
            return [];
        }
        try {
            $result = $this->cachedPost(
                '/employment/employees',
                ["emplids" => $emplIds]
            );
            return $result ?? [];
        } catch (RequestException $e) {
            $msg = $e->getMessage();
            $errorMessage = 'getEmployees Error: ' . $msg;
            throw new RuntimeException($errorMessage);
        }
    }

    /**
     * Get all employees for a department
     * @param int $deptId
     * @return array<array{
     *  ID: int,
     *  EMPLID: int | null,
     *  DEPTID: string,
     *  JOBCODE: string,
     *  CATEGORY: string,
     *  JOB_INDICATOR: string,
     * }>
     */
    public function getEmployeesForDepartment(int $deptId): array {
        try {
            $result = $this->cachedGet('/department/' . $deptId . '/employees');
            return $result;
        } catch (RequestException $e) {
            $msg = $e->getMessage();
            $errorMessage = 'getEmployees Error: ' . $msg;
            throw new RuntimeException($errorMessage);
        }
    }

    public function getLeavesForEmployee($emplId): array {
        try {
            $result = $this->cachedGet('/employment/leaves/' . $emplId);
            return $result;
        } catch (RequestException $e) {
            $msg = $e->getMessage();
            $errorMessage = 'getLeaves Error: ' . $msg;
            throw new RuntimeException($errorMessage);
        }
    }


    /**
     * Get all academic terms for CLA (undergrad and grad)
     * at the UMNTC
     *
     * @return array<object{
     *   id: int,
     *   TERM: int,
     *   TERM_BEGIN_DT: string, // "2019-01-22"
     *   TERM_END_DT: string,  // "2019-05-15"
     *   TERM_DESCRIPTION: string, //"Spring 2019"
     *   INSTITUTION: string, // "UMNTC"
     *   ACADEMIC_CAREER: string, // "UGRD"
     * }>
     */
    public function getTerms(): array {
        try {
            $result = $this->cachedGet('/classes/terms');
            return $result;
        } catch (RequestException $e) {
            $msg = $e->getMessage();
            $errorMessage = 'getTerms Error: ' . $msg;
            throw new RuntimeException($errorMessage);
        }
    }

    /**
     * Get all academic terms for CLA (undergrad and grad)
     * at the UMNTC
     *
     * @return \Illuminate\Support\Collection<array{
     *   id: int,
     *   TERM: int,
     *   TERM_BEGIN_DT: string, // "2019-01-22"
     *   TERM_END_DT: string,  // "2019-05-15"
     *   TERM_DESCRIPTION: string, //"Spring 2019"
     *   INSTITUTION: string, // "UMNTC"
     *   ACADEMIC_CAREER: string, // "UGRD"
     * }>
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

    /**
     * Retrieves a list of course details.
     *
     * @return array<object{
     *   id: int,
     *   TERM: int,
     *   INSTRUCTOR_EMPLID: int,
     *   ACADEMIC_ORG: int,
     *   SUBJECT: string,
     *   CLASS_SECTION: string,
     *   INSTRUCTOR_ROLE: string,
     *   CATALOG_NUMBER: string,
     *   CLASS_NUMBER: int,
     *   ACADEMIC_CAREER: string,
     *   DESCRIPTION: string,
     *   COMPONENT_CLASS: string,
     *   ENROLLMENT_CAP: int,
     *   ENROLLMENT_TOTAL: int,
     *   WAITLIST_CAP: int,
     *   WAITLIST_TOTAL: int,
     *   CANCELLED: int,
     *   ENROLLMENTS: array
     * }>
     */
    public function getDeptClassList(int $deptId): array {
        try {
            $result = $this->cachedGet('/classes/list/' . $deptId);
            return $result;
        } catch (RequestException $e) {
            $msg = $e->getMessage();
            $errorMessage = 'getDeptCourses Error: ' . $msg;
            throw new RuntimeException($errorMessage);
        }
    }

    public function getDeptScheduleForTerm(int $deptId, int $term): array {
        try {
            $result = $this->cachedGet('/classes/list/' . $deptId . "/" . $term);
            return $result;
        } catch (RequestException $e) {
            $msg = $e->getMessage();
            $errorMessage = 'getDepartmentSchedule Error: ' . $msg;
            throw new RuntimeException($errorMessage);
        }
    }

    /**
     * Get academic terms which coincide with the given date range
     *
     * @param Carbon|string $startDate
     * @param Carbon|string $endDate
     * @return \Illuminate\Support\Collection<array{
     *  id: int,
     *  TERM: int,
     *  TERM_BEGIN_DT: string, // "2019-01-22"
     *  TERM_END_DT: string,  // "2019-05-15"
     *  TERM_DESCRIPTION: string, //"Spring 2019"
     *  INSTITUTION: string, // "UMNTC"
     *  ACADEMIC_CAREER: string, // "UGRD"
     * }>
     */
    public function getTermsOverlappingDates($startDate, $endDate) {
        $terms = $this->getCLATerms();

        return $terms->filter(function ($term) use ($startDate, $endDate) {
            $termStartDate = new Carbon($term->TERM_BEGIN_DT);
            $termEndDate = new Carbon($term->TERM_END_DT);
            return $termStartDate->between($startDate, $endDate)
                || $termEndDate->between($startDate, $endDate);
        });
    }

    /**
     * This gets name info for a list of emplids. This can be used
     * as a fallback when a user is not found in LDAP.
     *
     * @param int[] $emplids
     * @return Collection<array{
     * id: int,
     * EMPLID: int,
     * NAME: string,
     * FIRST_NAME: string,
     * LAST_NAME: string,
     * MIDDLE_NAME: string,
     * INTERNET_ID: string,
     * }>
     */
    public function getNames(array $emplids): Collection {
        if (empty($emplids)) {
            return collect();
        }

        try {
            $result = $this->cachedPost('/names', ["emplids" => $emplids]);
            return collect($result);
        } catch (RequestException $e) {
            $msg = $e->getMessage();
            $errorMessage = 'getEmployees Error: ' . $msg;
            throw new RuntimeException($errorMessage);
        }
    }

    /**
     * gets a list of ALL classes taught by instructors in a department,
     * including classes in other departments.
     *
     * @param int $deptId - the department id
     * @param ?int $termCode (optional) - if not provided, will get all terms
     * @return array<object{
     *   id: int,
     *   TERM: int,
     *   INSTRUCTOR_EMPLID: int,
     *   ACADEMIC_ORG: int,
     *   SUBJECT: string,
     *   CLASS_SECTION: string,
     *   INSTRUCTOR_ROLE: string,
     *   CATALOG_NUMBER: string,
     *   CLASS_NUMBER: int,
     *   ACADEMIC_CAREER: string,
     *   DESCRIPTION: string,
     *   COMPONENT_CLASS: string,
     *   ENROLLMENT_CAP: int,
     *   ENROLLMENT_TOTAL: int,
     *   WAITLIST_CAP: int,
     *   WAITLIST_TOTAL: int,
     *   CANCELLED: int,
     *   COURSE_CROSSLIST: mixed
     * }>
     */
    public function getAllClassesForDeptInstructors(int $deptId, ?int $termCode = null): array
    {
        try {
            $url = "/classes/listAll/{$deptId}";
            if ($termCode) {
                $url .= "/{$termCode}";
            }

            $result = $this->cachedGet($url);
            return $result;
        } catch (RequestException $e) {
            $msg = $e->getMessage();
            $errorMessage = 'getAllClassesForDeptInstructors Error: ' . $msg;
            throw new RuntimeException($errorMessage);
        }
    }
}
