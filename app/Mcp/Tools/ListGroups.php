<?php

namespace App\Mcp\Tools;

use Illuminate\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;

class ListGroups extends Tool
{
    /**
     * The tool's description.
     */
    protected string $description = <<<'MARKDOWN'
        Get a list of all the groups in the system with their ID, Name, Type and Abbreviation
    MARKDOWN;

    /**
     * Handle the tool request.
     */
    public function handle(Request $request): Response
    {
        $groups = \App\Group::with('groupType')->get()->map(function ($group) {
            return [
            'id' => $group->id,
            'name' => $group->group_title,
            'abbreviation' => $group->abbreviation,
            'groupType' => $group->groupType->name
            ];
        });

        return Response::json($groups->toArray());
    }

    /**
     * Get the tool's input schema.
     *
     * @return array<string, \Illuminate\JsonSchema\JsonSchema>
     */
    public function schema(JsonSchema $schema): array
    {
	    return [
            'folder'=>$schema->integer()
                ->description('The folder ID to list groups from. If not provided, lists all groups.')->default(0)
        ];
    }
}
