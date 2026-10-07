<?php

namespace App\Library\TermPlan;

final class CostSettingDefinition {
    public function __construct(
        public readonly string $key,
        public readonly string $label,
        public readonly string $description,
        public readonly CostSettingType $type,
        public readonly float|int|bool $default,
    ) {
    }
}
