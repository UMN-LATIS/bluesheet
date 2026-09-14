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
});

/**
 * Fall 2019 in tests/Fixtures/Bandaid/mockGetTerms.json,
 * which runs 2019-09-03 to 2019-12-19.
 */
const FALL_2019 = 1199;

describe('getTermsOverlappingDates()', function () {
    it('finds a term that contains the whole range', function () {
        $terms = (new Bandaid())->getTermsOverlappingDates('2019-10-01', '2019-11-01');

        expect($terms->pluck('TERM')->all())->toBe([FALL_2019]);
    });

    it('finds a term the range contains', function () {
        $terms = (new Bandaid())->getTermsOverlappingDates('2019-08-01', '2020-01-31');

        expect($terms->pluck('TERM')->all())->toContain(FALL_2019);
    });

    it('finds no term for a range that ends before any term begins', function () {
        $terms = (new Bandaid())->getTermsOverlappingDates('2019-01-01', '2019-01-31');

        expect($terms)->toBeEmpty();
    });
});
