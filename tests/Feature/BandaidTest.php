<?php

use App\Library\Bandaid;
use Illuminate\Support\Facades\Http;


beforeEach(function () {
    setupMockBandaidApiResponses();
});

describe('getTerms', function () {
    it('getTerms returns an array of terms', function () {
        $bandaid = new Bandaid();
        $terms = $bandaid->getTerms();
        expect($terms)->toBeArray();
        expect($terms)->not()->toBeEmpty();
    });

    it('has the expected keys', function () {
        $bandaid = new Bandaid();
        $terms = $bandaid->getTerms();
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
});

describe('getDeptClassList', function () {
    // it('getDeptClassList returns an array of class records', function () {
    //     $bandaid = new Bandaid();
    //     $records = $bandaid->getDeptClassList(1);
    //     expect($records)->toBeArray();
    // });

    // it('has the expected keys', function () {});
});
