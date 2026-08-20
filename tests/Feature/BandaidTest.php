<?php

use App\Library\Bandaid;
use Illuminate\Support\Facades\Http;




beforeEach(function () {
    setupMockBandaidApiResponses();
});

describe('Bandaid Service Mocks', function () {
    it('getTerms() returns an array of terms', function () {
        $bandaid = new Bandaid();
        $terms = $bandaid->getTerms();
        expect($terms)->toBeArray();
        expect($terms)->not()->toBeEmpty();
        expect($terms[0])->toHaveKeys([
            'id',
            'TERM',
            'TERM_BEGIN_DT',
            'TERM_END_DT',
            'TERM_DESCRIPTION',
            'INSTITUTION',
            'ACADEMIC_CAREER',
        ]);
    });

    it('getDeptClassList() returns an array of class records', function () {
        $bandaid = new Bandaid();
        $records = $bandaid->getDeptClassList(1);
        expect($records)->toBeArray();
        expect($records)->not()->toBeEmpty();
        expect($records[0])->toHaveKeys([
            "id",
            "TERM",
            "INSTRUCTOR_EMPLID",
            "ACADEMIC_ORG",
            "SUBJECT",
            "CLASS_SECTION",
            "INSTRUCTOR_ROLE",
            "CATALOG_NUMBER",
            "CLASS_NUMBER",
            "ACADEMIC_CAREER",
            "DESCRIPTION",
            "COMPONENT_CLASS",
            "ENROLLMENT_CAP",
            "ENROLLMENT_TOTAL",
            "WAITLIST_CAP",
            "WAITLIST_TOTAL",
            "CANCELLED",
        ]);
    });

    it('getEmployeesForDepartment() returns a list of dept employees', function () {
        $bandaid = new Bandaid();
        $employees = $bandaid->getEmployeesForDepartment(1);
        expect($employees)->toBeArray();
        expect($employees)->not()->toBeEmpty();
        expect($employees[0])->toHaveKeys([
            'ID',
            'EMPLID',
            'DEPTID',
            'JOBCODE',
            'CATEGORY',
            'JOB_INDICATOR',
        ]);
    });

    it('getEmployeeDetail() returns employee details including address info', function () {
        $bandaid = new Bandaid();
        $employee = $bandaid->getEmployeeDetail(145);
        expect($employee)->toBeObject();
        expect($employee)->toHaveProperties([
            'EMPLID',
            'DEPTID',
            'DEPTNAME',
            'JOBCODE',
            'POSITION_DESCR',
            'JOB_INDICATOR',
            'OFFICE_ADDRESS',
        ]);
    });

    it('searchNames() returns a collection of matching people', function () {
        $bandaid = new Bandaid();
        $results = $bandaid->searchNames('smith');
        expect($results)->toBeInstanceOf(\Illuminate\Support\Collection::class);
        expect($results)->not()->toBeEmpty();
        expect($results->first())->toHaveProperties([
            'EMPLID',
            'NAME',
            'FIRST_NAME',
            'LAST_NAME',
            'FULL_NAME',
            'INTERNET_ID',
            'UMNDID',
        ]);
    });
});
