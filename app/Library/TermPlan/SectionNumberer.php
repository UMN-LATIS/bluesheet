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

    private static function afterHighest(array $claimed): string {
        $highest = max(array_map('intval', $claimed));

        return str_pad((string) ($highest + 1), 3, '0', STR_PAD_LEFT);
    }
}
