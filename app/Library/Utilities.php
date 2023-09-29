<?php

namespace App\Library;

class Utilities {
    public static function trimWithFallback($string, $default = 'Unspecified') {
        if (!is_string($string)) {
            return $default;
        }
        $trimmedString = trim($string);
        return $trimmedString ? $trimmedString : $default;
    }
}
