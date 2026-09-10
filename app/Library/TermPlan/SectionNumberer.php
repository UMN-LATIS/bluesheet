<?php

namespace App\Library\TermPlan;

class SectionNumberer {
    /**
     * @param string[] $taken numbers the course already holds in the destination term
     * @param string[] $incoming numbers arriving, in their sections' order
     * @return string[] one number per incoming section, in that same order
     */
    public static function assignWithinCourse(array $taken, array $incoming): array {
        $keeping = array_filter(
            $incoming,
            fn(string $number) => !in_array($number, $taken, true),
        );

        $claimed = [...array_values($taken), ...array_values($keeping)];
        $assigned = $keeping;

        foreach (array_diff_key($incoming, $keeping) as $position => $number) {
            $next = self::afterHighest($claimed);
            $claimed[] = $next;
            $assigned[$position] = $next;
        }

        ksort($assigned);

        return array_values($assigned);
    }

    /**
     * `TBA1`, `TBA2`, ... for sections arriving without numbers, counting on
     * from any the course already holds.
     *
     * @param string[] $taken numbers the course already holds in the destination term
     * @return string[] one placeholder per section, in the order asked for
     */
    public static function placeholdersWithinCourse(array $taken, int $count): array {
        $highest = 0;

        foreach ($taken as $number) {
            if (preg_match('/^TBA(\d+)$/', $number, $found)) {
                $highest = max($highest, (int) $found[1]);
            }
        }

        return $count === 0
            ? []
            : array_map(
                fn(int $offset) => 'TBA' . ($highest + $offset),
                range(1, $count),
            );
    }

    private static function afterHighest(array $claimed): string {
        $highest = max(array_map('intval', $claimed));

        return str_pad((string) ($highest + 1), 3, '0', STR_PAD_LEFT);
    }
}
