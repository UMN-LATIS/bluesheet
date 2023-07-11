<?php

namespace App;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Leave extends Model
{
    use HasFactory;
    const STATUS_CONFIRMED = 'confirm';
    const STATUS_PENDING = 'pending';
    const STATUS_CANCELLED = 'cancelled';
    const TYPE_SABITICAL = 'sabitical';
}
