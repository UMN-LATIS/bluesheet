<?php

use App\Library\TermPlan\FiscalYear;
use App\Library\TermPlan\Season;

it('puts a fall term in the fiscal year that ends the next summer', function () {
    expect(FiscalYear::ofTerm(1269))->toBe(2027);
});

it('puts a spring term in the fiscal year that ends that June', function () {
    expect(FiscalYear::ofTerm(1273))->toBe(2027);
    expect(FiscalYear::ofTerm(1263))->toBe(2026);
});

it('puts a summer term in the same fiscal year as the spring before it', function () {
    expect(FiscalYear::ofTerm(1275))->toBe(2027);
});

it('refuses a term code whose last digit names no season', function () {
    Season::ofTerm(1271);
})->throws(InvalidArgumentException::class);

it('returns null instead of throwing when asked to try a term code with no season', function () {
    expect(Season::tryOfTerm(1271))->toBeNull();
});
