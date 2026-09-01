<?php

namespace App\Library\Sis;

use App\SisClassSection;

/**
 * Reads the slash-delimited crosslist string the SIS stores on a section,
 * such as "AFRO 4406-001/GWSS 4406-001".
 *
 * One classroom shared by two departments arrives as two sections, each
 * listing both. A schedule that drew both would show the room double-booked,
 * so exactly one section is elected to own the block: the one whose subject
 * and catalog number sort first. The election has to happen here rather than
 * in the client, because the partner usually belongs to another department
 * and so never appears in the same payload.
 *
 * Performs no I/O.
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
     * Entries that don't match the expected shape are dropped. A section left
     * with fewer than two entries is treated as not crosslisted, which draws
     * it normally: showing a block twice beats losing it entirely.
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

    /** The entry that owns the block, by subject then catalog number then section. */
    private static function first(array $entries): array {
        usort($entries, fn(array $a, array $b) => [$a['subject'], $a['catalogNumber'], $a['section']]
            <=> [$b['subject'], $b['catalogNumber'], $b['section']]);

        return $entries[0];
    }
}
