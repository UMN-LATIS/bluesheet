<?php

use App\Leave;
use App\Library\LeavePlanning\TimelineTermRange;
use App\SisTerm;
use Tests\TestCase;

uses(TestCase::class);

function undergradTermsSummer2025ThroughFall2027() {
    return collect([
        [1255, '2025-05-19', '2025-08-15'],
        [1259, '2025-09-02', '2025-12-22'],
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
    return TimelineTermRange::of(undergradTermsSummer2025ThroughFall2027(), collect($leaves), $today, $start, $end);
}

it('opens from the same term a year earlier to the current term when no leave is to come', function () {
    expect(rangeOn('2026-10-01'))->toBe(['startTermId' => 1259, 'endTermId' => 1269]);
});

it('uses the next term as current between terms', function () {
    expect(rangeOn('2026-08-25'))->toBe(['startTermId' => 1259, 'endTermId' => 1269]);
});

it('starts at the earliest term when the terms do not reach back a year', function () {
    expect(rangeOn('2026-03-01'))->toBe(['startTermId' => 1255, 'endTermId' => 1263]);
});

it('does not move the start back for a leave in progress', function () {
    $sabbatical = leaveBetween('2025-01-01', '2026-12-31');

    expect(rangeOn('2026-10-01', [$sabbatical]))->toBe(['startTermId' => 1259, 'endTermId' => 1269]);
});

it('ends at the term the latest upcoming leave ends in', function () {
    $upcoming = leaveBetween('2027-09-07', '2027-12-23');

    expect(rangeOn('2026-10-01', [$upcoming]))->toBe(['startTermId' => 1259, 'endTermId' => 1279]);
});

it('ends at the previous term when the latest leave ends between terms', function () {
    $upcoming = leaveBetween('2027-01-19', '2027-08-30');

    expect(rangeOn('2026-10-01', [$upcoming]))->toBe(['startTermId' => 1259, 'endTermId' => 1275]);
});

it('keeps a requested start and moves the default end up to meet it', function () {
    expect(rangeOn('2026-10-01', [], start: 1275))->toBe(['startTermId' => 1275, 'endTermId' => 1275]);
});

it('keeps a requested end and moves the default start back to meet it', function () {
    expect(rangeOn('2026-10-01', [], end: 1255))->toBe(['startTermId' => 1255, 'endTermId' => 1255]);
});

it('keeps both requested sides as given', function () {
    $sabbatical = leaveBetween('2026-02-01', '2027-12-31');

    expect(rangeOn('2026-10-01', [$sabbatical], 1265, 1273))->toBe(['startTermId' => 1265, 'endTermId' => 1273]);
});

it('treats the last term as current once every term has ended', function () {
    expect(rangeOn('2028-03-01'))->toBe(['startTermId' => 1269, 'endTermId' => 1279]);
});
