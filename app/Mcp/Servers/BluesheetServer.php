<?php

namespace App\Mcp\Servers;

use Laravel\Mcp\Server;

class BluesheetServer extends Server
{
    /**
     * The MCP server's name.
     */
    protected string $name = 'Bluesheet Server';

    /**
     * The MCP server's version.
     */
    protected string $version = '0.0.1';

    /**
     * The MCP server's instructions for the LLM.
     */
    protected string $instructions = <<<'MARKDOWN'
        Provides the ability to determine who serves in a particular role for a particular department at the University of Minnesota College of Liberal Arts. Any time you reply with a response, you can link back to the original group using https://bluesheet.cla.umn.edu/groups/<GroupId> where <GroupId> is the id of the group you are referencing. Keep in mind that users often refer to roles using partial terms - they might say "chair" instead of "academic department chair". 
    MARKDOWN;

    /**
     * The tools registered with this MCP server.
     *
     * @var array<int, class-string<\Laravel\Mcp\Server\Tool>>
     */
    protected array $tools = [
        \App\Mcp\Tools\GetRolesForGroup::class,
        \App\Mcp\Tools\ListGroups::class,
    ];

    /**
     * The resources registered with this MCP server.
     *
     * @var array<int, class-string<\Laravel\Mcp\Server\Resource>>
     */
    protected array $resources = [
        //
    ];

    /**
     * The prompts registered with this MCP server.
     *
     * @var array<int, class-string<\Laravel\Mcp\Server\Prompt>>
     */
    protected array $prompts = [
        //
    ];
}
