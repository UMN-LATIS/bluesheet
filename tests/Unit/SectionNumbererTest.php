<?php

use App\Library\TermPlan\SectionNumberer;

function assignNumbers(array $taken, array $incoming): array {
    return SectionNumberer::assignWithinCourse($taken, $incoming);
}

describe('SectionNumberer', function () {
    it('leaves every number alone when the course is empty', function () {
        expect(assignNumbers([], ['001', '002', '011']))->toBe(['001', '002', '011']);
    });

    it('keeps a number the course does not already hold', function () {
        expect(assignNumbers(['001'], ['002']))->toBe(['002']);
    });

    it('moves a taken number to one past the highest', function () {
        $taken = ['001', '002', '003', '011', '012'];

        expect(assignNumbers($taken, ['011']))->toBe(['013']);
    });

    it('gives two colliding sections different numbers', function () {
        expect(assignNumbers(['001', '002'], ['001', '002']))->toBe(['003', '004']);
    });

    it('lets a free number stay free when a sibling is renumbered', function () {
        expect(assignNumbers(['009'], ['009', '010']))->toBe(['011', '010']);
    });

    it('leaves gaps below the highest alone', function () {
        expect(assignNumbers(['001', '002', '005'], ['002']))->toBe(['006']);
    });

    it('pads to three digits and grows past them', function () {
        expect(assignNumbers(['009'], ['009']))->toBe(['010']);
        expect(assignNumbers(['099'], ['099']))->toBe(['100']);
        expect(assignNumbers(['999'], ['999']))->toBe(['1000']);
    });
});
