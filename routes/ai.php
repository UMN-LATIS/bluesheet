<?php

use App\Mcp\Servers\BluesheetServer;
use Laravel\Mcp\Facades\Mcp;


Mcp::web('/mcp/bluesheet', BluesheetServer::class)->middleware('auth:sanctum');
