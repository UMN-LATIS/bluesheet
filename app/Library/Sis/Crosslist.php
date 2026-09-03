<?php

namespace App\Library\Sis;

use App\SisClassSection;

/**
 * Parses the SIS crosslist string, e.g. "AFRO 4406-001/GWSS 4406-001".
 * One section per listed department arrives; the first by subject and
 * catalog number owns the grid block. Elected here, not in the client,
 * because partner sections are usually outside the client's payload.
 */
class Crosslist {
    /** "AFRO 4406-001" — subject, catalog number, section. */
    private const ENTRY_PATTERN = '/^\s*([A-Za-z]+)\s+([A-Za-z0-9]+)\s*-\s*([A-Za-z0-9]+)\s*$/';

    /**
     * @return null|array{raw: string, partners: array<array{subject: string, catalogNumber: string, section: string}>, isPrimary: bool}
     */
    public static function describe(SisClassSection $section): ?array {
        $raw = trim((string) $section->crosslist);

        if ($raw === '') {
            return null;
        }

        $entries = self::parse($raw);

        if (count($entries) < 2) {
            return null;
        }

        $isSelf = fn(array $entry) => strcasecmp($entry['subject'], $section->subject) === 0
            && strcasecmp($entry['catalogNumber'], $section->catalog_number) === 0
            && strcasecmp($entry['section'], $section->class_section) === 0;

        $partners = array_values(array_filter($entries, fn(array $entry) => !$isSelf($entry)));

        return [
            'raw' => $raw,
            'partners' => $partners,
            'isPrimary' => $isSelf(self::first($entries)),
        ];
    }

    /**
     * Malformed entries are dropped; fewer than two left means not
     * crosslisted, so the section still draws (twice beats not at all).
     *
     * @return array<array{subject: string, catalogNumber: string, section: string}>
     */
    private static function parse(string $raw): array {
        $entries = [];

        foreach (explode('/', $raw) as $entry) {
            if (preg_match(self::ENTRY_PATTERN, $entry, $matches)) {
                $entries[] = [
                    'subject' => strtoupper($matches[1]),
                    'catalogNumber' => strtoupper($matches[2]),
                    'section' => $matches[3],
                ];
            }
        }

        return $entries;
    }

    /**
     * The entry that owns the block, by subject
     * then catalog number then section.
     */
    private static function first(array $entries): array {
        usort($entries, fn(array $a, array $b) => [$a['subject'], $a['catalogNumber'], $a['section']]
            <=> [$b['subject'], $b['catalogNumber'], $b['section']]);

        return $entries[0];
    }
}
