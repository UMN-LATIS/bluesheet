<?php

namespace App\Mcp\Tools;

use Illuminate\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;

class GetRolesForGroup extends Tool
{
    /**
     * The tool's description.
     */
    protected string $description = <<<'MARKDOWN'
        Given a group ID, lists all of the people associated with that group, including their name, email and role. 
    MARKDOWN;

    /**
     * Handle the tool request.
     */
    public function handle(Request $request): Response
    {
        $groupId = $request->input('groupId');
        $group = \App\Group::find($groupId);

        $membership = $group->activeMembers->map(function ($member) {
            return [
                'name' => $member->user->displayName,
                'email' => $member->user->email,
                'role' => $member->role->label,
            ];
        });

        return Response::json($membership);
    }

    /**
     * Get the tool's input schema.
     *
     * @return array<string, \Illuminate\JsonSchema\JsonSchema>
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'groupId'=> $schema->integer()
                ->description('The ID of the group to get roles for.')
                ->required(),
        ];
    }
}
