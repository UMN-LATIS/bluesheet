<?php

namespace App\Http\Controllers\Remote;

use App\Group;
use App\Http\Controllers\Controller;

class GroupController extends Controller {
    public function index() {
        return Group::with('groupType:id,label')->get([
            'id',
            'group_title',
            'dept_id',
            'parent_group_id',
            'parent_organization_id',
            'active_group',
            'group_type_id',
            'deleted_at',
        ]);
    }
}
