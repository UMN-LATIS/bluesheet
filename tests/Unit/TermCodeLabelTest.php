<?php

use App\Library\LeavePlanning\TermCodeLabel;

it('labels spring, summer, and fall by the last digit', function () {
    expect(TermCodeLabel::of(1263))->toBe('SP26');
    expect(TermCodeLabel::of(1265))->toBe('SU26');
    expect(TermCodeLabel::of(1269))->toBe('FA26');
});

it('keeps the leading zero of a year', function () {
    expect(TermCodeLabel::of(1303))->toBe('SP30');
    expect(TermCodeLabel::of(1209))->toBe('FA20');
});

it('refuses a code whose last digit names no season', function () {
    TermCodeLabel::of(1267);
})->throws(InvalidArgumentException::class);
