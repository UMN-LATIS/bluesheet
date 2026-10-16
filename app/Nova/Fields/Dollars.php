<?php

namespace App\Nova\Fields;

use Laravel\Nova\Fields\Number;

// Nova's Currency field formats through PHP's intl extension, which the
// servers lack, so swapping this back to Currency throws on every page
// that shows a rate.
class Dollars extends Number {
    public function __construct($name, mixed $attribute = null, ?callable $resolveCallback = null) {
        parent::__construct($name, $attribute, $resolveCallback);

        $this->step(0.01)
            ->min(0)
            ->rules('required', 'decimal:0,2', 'min:0', 'max:99999999.99')
            ->displayUsing(fn($amount) => $amount === null ? null : '$' . number_format((float) $amount, 2));
    }
}
