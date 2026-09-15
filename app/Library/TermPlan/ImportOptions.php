<?php

namespace App\Library\TermPlan;

final class ImportOptions {
    private const ASSISTANT_ROLE = 'TA';

    public function __construct(
        public readonly bool $instructors = true,
        public readonly bool $tas = false,
        public readonly bool $meetingTimes = true,
        public readonly bool $sectionNumbers = true,
    ) {
    }

    public static function fromRequestInclude(array $include): self {
        return new self(
            instructors: (bool) ($include['instructors'] ?? true),
            tas: (bool) ($include['tas'] ?? false),
            meetingTimes: (bool) ($include['meetingTimes'] ?? true),
            sectionNumbers: (bool) ($include['sectionNumbers'] ?? true),
        );
    }

    public function includesRole(string $role): bool {
        return $role === self::ASSISTANT_ROLE ? $this->tas : $this->instructors;
    }
}
