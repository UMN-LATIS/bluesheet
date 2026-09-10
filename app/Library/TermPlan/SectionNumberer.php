<?php

namespace App\Library\TermPlan;

class SectionNumberer {
    /**
     * @param string[] $taken numbers the course already holds in the destination term
     * @param string[] $incoming numbers arriving, in their sections' order
     * @return string[] one number per incoming section, in that same order
     */
    public static function assignWithinCourse(array $taken, array $incoming): array {
        // Keep the keys. `array_values` here breaks the
        // SectionNumbererTest "free number stays free" case:
        // `$assignedNumbers[$position]` maps by them.
        $keptNumbers = array_filter(
            $incoming,
            fn(string $number) => !in_array($number, $taken, true),
        );

        $claimedNumbers = [...array_values($taken), ...array_values($keptNumbers)];
        $assignedNumbers = $keptNumbers;

        foreach (array_diff_key($incoming, $keptNumbers) as $position => $number) {
            $next = self::nextNumberAfterHighest($claimedNumbers);
            $claimedNumbers[] = $next;
            $assignedNumbers[$position] = $next;
        }

        ksort($assignedNumbers);

        return array_values($assignedNumbers);
    }

    /**
     * `TBA1`, `TBA2`, ... for sections arriving without numbers, counting on
     * from any the course already holds.
     *
     * @param string[] $taken numbers the course already holds in the destination term
     * @return string[] one placeholder per section, in the order asked for
     */
    public static function placeholdersWithinCourse(array $taken, int $count): array {
        if ($count === 0) {
            return [];
        }

        $highest = 0;

        foreach ($taken as $number) {
            if (preg_match('/^TBA(\d+)$/', $number, $found)) {
                $highest = max($highest, (int) $found[1]);
            }
        }

        return array_map(
            fn(int $offset) => 'TBA' . ($highest + $offset),
            range(1, $count),
        );
    }

    private static function nextNumberAfterHighest(array $claimedNumbers): string {
        $highest = max(array_map('intval', $claimedNumbers));

        return str_pad((string) ($highest + 1), 3, '0', STR_PAD_LEFT);
    }
}
