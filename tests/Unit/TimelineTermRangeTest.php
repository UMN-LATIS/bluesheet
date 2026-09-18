<?php

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

function rangeOn(string $today, ?int $start = null, ?int $end = null): array {
    return TimelineTermRange::of(undergradTermsSummer2025ThroughFall2027(), $today, $start, $end);
}

it('opens from the same term a year before the current one to the same term a year after', function () {
    expect(rangeOn('2026-10-01'))->toBe(['startTermCode' => 1259, 'endTermCode' => 1279]);
});

it('uses the next term as current between terms', function () {
    expect(rangeOn('2026-08-25'))->toBe(['startTermCode' => 1259, 'endTermCode' => 1279]);
});

it('starts at the earliest term when the terms do not reach back a year', function () {
    expect(rangeOn('2026-03-01'))->toBe(['startTermCode' => 1255, 'endTermCode' => 1273]);
});

it('ends at the latest term when the terms do not reach forward a year', function () {
    expect(rangeOn('2027-03-01'))->toBe(['startTermCode' => 1263, 'endTermCode' => 1279]);
});

it('keeps a requested start and moves the default end up to meet it', function () {
    expect(rangeOn('2026-03-01', start: 1279))->toBe(['startTermCode' => 1279, 'endTermCode' => 1279]);
});

it('keeps a requested end and moves the default start back to meet it', function () {
    expect(rangeOn('2026-10-01', end: 1255))->toBe(['startTermCode' => 1255, 'endTermCode' => 1255]);
});

it('keeps both requested sides as given', function () {
    expect(rangeOn('2026-10-01', 1265, 1273))->toBe(['startTermCode' => 1265, 'endTermCode' => 1273]);
});

it('treats the last term as current once every term has ended', function () {
    expect(rangeOn('2028-03-01'))->toBe(['startTermCode' => 1269, 'endTermCode' => 1279]);
});
