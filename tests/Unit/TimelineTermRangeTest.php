<?php

use App\Leave;
use App\Library\LeavePlanning\TimelineTermRange;
use App\SisTerm;
use Tests\TestCase;

uses(TestCase::class);

function undergradTermsSpring2026ThroughFall2027() {
    return collect([
        [1263, '2026-01-20', '2026-05-13'],
        [1265, '2026-05-18', '2026-08-14'],
        [1269, '2026-09-08', '2026-12-23'],
        [1273, '2027-01-19', '2027-05-12'],
        [1275, '2027-05-17', '2027-08-13'],
        [1279, '2027-09-07', '2027-12-23'],
    ])->shuffle()->map(fn(array $term) => new SisTerm([
        'term_code' => $term[0],
        'begins_on' => $term[1],
        'ends_on' => $term[2],
    ]));
}

function leaveBetween(string $startDate, string $endDate): Leave {
    return new Leave(['start_date' => $startDate, 'end_date' => $endDate]);
}

function rangeOn(string $today, array $leaves = [], ?int $start = null, ?int $end = null): array {
    return TimelineTermRange::of(undergradTermsSpring2026ThroughFall2027(), collect($leaves), $today, $start, $end);
}

it('opens on the current term alone when no leave is in progress or to come', function () {
    expect(rangeOn('2026-10-01'))->toBe(['startTermId' => 1269, 'endTermId' => 1269]);
});

it('uses the next term as current between terms', function () {
    expect(rangeOn('2026-08-25'))->toBe(['startTermId' => 1269, 'endTermId' => 1269]);
});

it('starts at the term an in-progress leave began in', function () {
    $sabbatical = leaveBetween('2026-02-01', '2026-12-31');

    expect(rangeOn('2026-10-01', [$sabbatical]))->toBe(['startTermId' => 1263, 'endTermId' => 1269]);
});

it('starts at the next term when an in-progress leave began between terms', function () {
    $leave = leaveBetween('2026-08-20', '2027-05-01');

    expect(rangeOn('2026-10-01', [$leave]))->toBe(['startTermId' => 1269, 'endTermId' => 1273]);
});

it('ignores a leave that has already ended', function () {
    $finished = leaveBetween('2026-01-20', '2026-05-13');

    expect(rangeOn('2026-10-01', [$finished]))->toBe(['startTermId' => 1269, 'endTermId' => 1269]);
});

it('ends at the term the latest upcoming leave ends in', function () {
    $upcoming = leaveBetween('2027-09-07', '2027-12-23');

    expect(rangeOn('2026-10-01', [$upcoming]))->toBe(['startTermId' => 1269, 'endTermId' => 1279]);
});

it('ends at the previous term when the latest leave ends between terms', function () {
    $upcoming = leaveBetween('2027-01-19', '2027-08-30');

    expect(rangeOn('2026-10-01', [$upcoming]))->toBe(['startTermId' => 1269, 'endTermId' => 1275]);
});

it('keeps a requested start and moves the default end up to meet it', function () {
    expect(rangeOn('2026-10-01', [], start: 1275))->toBe(['startTermId' => 1275, 'endTermId' => 1275]);
});

it('keeps a requested end and moves the default start back to meet it', function () {
    expect(rangeOn('2026-10-01', [], end: 1263))->toBe(['startTermId' => 1263, 'endTermId' => 1263]);
});

it('keeps both requested sides as given', function () {
    $sabbatical = leaveBetween('2026-02-01', '2027-12-31');

    expect(rangeOn('2026-10-01', [$sabbatical], 1265, 1273))->toBe(['startTermId' => 1265, 'endTermId' => 1273]);
});

it('treats the last term as current once every term has ended', function () {
    expect(rangeOn('2028-03-01'))->toBe(['startTermId' => 1279, 'endTermId' => 1279]);
});

it('falls back to the current term when an in-progress leave began after every term', function () {
    $leave = leaveBetween('2028-01-10', '2028-06-01');

    expect(rangeOn('2028-03-01', [$leave]))->toBe(['startTermId' => 1279, 'endTermId' => 1279]);
});
