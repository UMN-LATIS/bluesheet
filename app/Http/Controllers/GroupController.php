<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Resources\Group as GroupResource;
use App\Http\Resources\Membership as MembershipResource;
use App\ParentOrganization;
use DB;
use App\Group;
use App\Constants\Permissions;

class GroupController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request) {
        $groups = Group::where("active_group", 1)
            ->with("groupType", "parentGroup", "childGroups", "parentOrganization", "artifacts", "activeMembers")
            ->get();

        // batch get group permissions rather than using Group Policy
        // directly to avoid n+1 queries. Maybe this should be elsewhere,
        // so that it doesn't diverge from GroupPolicy update method?
        $managedGroupIds = $request->user()
            ->getManagedGroups()
            ->pluck('id')
            ->keyBy(fn ($id) => $id);
        $canModifyAnyGroup = $request->user()->can(Permissions::EDIT_GROUPS);

        // Enhance groups with permission data
        return $groups->map(function ($group) use ($managedGroupIds, $canModifyAnyGroup) {
            $group->canCurrentUser = [
                'update' => $canModifyAnyGroup || $managedGroupIds->has($group->id),
                'delete' => $canModifyAnyGroup || $managedGroupIds->has($group->id),
            ];
            return $group;
        });
    }

    public function getGroupsByFolder(ParentOrganization $parentOrganization=null) {
        if(!$parentOrganization) {
            $childFolders = \App\ParentOrganization::whereNull("parent_organization_id")->get();
            $childGroups = [];

        }
        else {
            $childFolders = $parentOrganization->childOrganizations;
            $childGroups = $parentOrganization->groups()->with(['childGroups' => function ($query) {
                $query->where('active_group', 1);
            }])->get();
            
        }
        return response()->json(["folders"=>$childFolders, "groups"=>$childGroups]);
    }

    public function groupSearch(Request $request) {
        $searchTerm = $request->get("searchTerm");
        $groups = \App\Group::where("group_title","like", "%" . $searchTerm . "%")->get()->load("childGroups");
        foreach($groups as $group) {
            if($group->parentGroup) {
                $groups[] = $group->parentGroup->load("childGroups");
            }
        }
        return response()->json(["folders"=>[], "groups"=>$groups->unique()]);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'groupName' => 'required',
            'groupType' => 'required',
            'parentOrganization' => 'exists:parent_organizations,id|nullable',
            'parentGroupId' => 'exists:groups,id|nullable',
        ]);

        $parentGroupId = $validated['parentGroupId'] ?? null;
        $parentGroup = Group::find($parentGroupId);
        $this->authorize('create', [Group::class, $parentGroup]);

        $newGroup = new \App\Group;

        $newGroup->group_title = $request->get("groupName");

        if($groupType = $request->get("groupType")) {
            if(isset($groupType["id"])) {
                $newGroup->group_type_id = $groupType["id"];
            }
            else {
                $newGroup->group_type_id = $this->addOrFindGroupType($groupType)->id;
            }
        }
        else {
            $returnData = array(
            'status' => 'error',
            'message' => 'Could Not Add or Update Group Type'
            );
            return Response()->json($returnData, 500);
        }

        $newGroup->parent_organization_id = $request->get("parentOrganization");
        $newGroup->parent_group_id = $parentGroupId;
        $newGroup->active_group = 1;
        $newGroup->show_unit = false;
        $newGroup->save();

        return GroupResource::make($newGroup);
    }

    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($group, $hash=null)
    {
        if(!$this->authorize('view', $group) && ($hash != $group->hash)) {
            $returnData = array(
                'status' => 'error',
                'message' => "You don't have permission to access this group"
            );
            return Response()->json($returnData, 500);
        }
        else {
            if($group->include_child_groups) {
                return new GroupResource($group->load('members', 'members.user', 'members.role', 'childGroups', 'childGroups.members', 'childGroups.members.user', 'childGroups.members.role', 'activeMembers', 'activeMembers.user'));
            }
            else {
                return new GroupResource($group->load('members', 'members.user', 'members.role', 'activeMembers', 'activeMembers.user'));
            }
            
        }
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $group)
    {
        if(!$this->authorize('update', $group)) {
            $returnData = array(
                'status' => 'error',
                'message' => "You don't have permission to edit this group"
            );
            return Response()->json($returnData, 500);
        }

        $group->fill($request->all());

        if($groupType = $request->get("group_type")) {
            if(isset($groupType["id"])) {
                $group->group_type_id = $groupType["id"];
            }
            else {
                $group->group_type_id = $this->addOrFindGroupType($groupType)->id;
            }
        }
        else {
            $returnData = array(
            'status' => 'error',
            'message' => 'Could Not Add or Update Group Type'
            );
            return Response()->json($returnData, 500);
        }
        
        if($request->get("parent_organization")) {
            $group->parent_organization_id = $request->get("parent_organization")["id"];    
        }

        $group->save();
        $foundArtifactIds = [];
        foreach($request->get('artifacts') as $artifact) {
            if(isset($artifact['id'])) {
                \App\GroupArtifact::find($artifact['id'])->fill($artifact)->save();
                $foundArtifactIds[] = $artifact['id'];
            }
            else {
                if($artifact["label"]) {
                    $newArtifact = new \App\GroupArtifact;
                    $newArtifact->fill($artifact);
                    $group->artifacts()->save($newArtifact);
                    $foundArtifactIds[] = $newArtifact->id;
                }
                
            }
        }

        foreach($group->artifacts as $artifact) {
            if(!in_array($artifact->id, $foundArtifactIds)) {
                $artifact->delete();
            }
        }

        $newMemberIds = array();

        foreach($request->get('members') as $member) {
            if(isset($member['id'])) {
                $loadedMember = \App\Membership::find($member['id']);

                // we're assigning a new role, make a new record
                if(!isset($member['role']['id']) || $member['role']['id'] != $loadedMember->role_id) {
                    $loadedMember->end_date = \Carbon\Carbon::now();
                    $loadedMember->save();
                    $newMember = $loadedMember->replicate();
                    $newMember->fill($member);
                    $newMember->start_date = \Carbon\Carbon::now();
                    if(!isset($member['role']['id'])) {
                        if(isset($member['role']['label'])) {
                            $role = $this->addOrFindRole($member['role']['label']);    
                        }
                        else {
                            $role = $this->addOrFindRole($member['role']);
                        }
                        
                        $newMember->role()->associate($role);
                    }
                    else {
                        $role = $member['role']['id'];
                        $newMember->role_id = $role;
                    }

                    if($role) {
                        $newMember->save();    
                    }
                    else {
                        return response()->json(["success"=>false, "error"=>"Could not save this role"]);
                    }
                    $newMemberIds[] = $newMember->id;
                    
                }
                else {
                    $loadedMember->fill($member);
                    $loadedMember->save();    
                }
                
            }
            else {
                $newMember = new \App\Membership;
                $newMember->fill($member);
                $newMember->user_id = $member['user']['id'];
                $newMember->group_id = $member['group_id'];
                if(!isset($member['role']['id'])) {
                    if(isset($member['role']['label'])) {
                        $role = $this->addOrFindRole($member['role']['label']);    
                    }
                    else {
                        $role = $this->addOrFindRole($member['role']);
                    }
                    $newMember->role()->associate($role);
                }
                else {
                    $role = $member['role']['id'];
                    $newMember->role_id = $role;
                }
                
                $group->members()->save($newMember);
                $newMemberIds[] = $newMember->id;
            }

        }

        

        // if the submissions from the browser are missing some users, we assume they've been really deleted.  Let's remove the membership.
        // this is the kind of thing that would happen automatically if we were using sync() but ...
        $memberIds = array_merge(array_column($request->get('members'), "id"), $newMemberIds);
        $missingMembers = array_diff($group->members()->pluck("id")->toArray(), $memberIds);
        foreach($missingMembers as $missingMember) {
            $loadedMember = \App\Membership::find($missingMember);
            $loadedMember->delete();
        } 

        return response()->json(["success"=>true]);
    }

    private function addOrFindRole($label) {
        $role = \App\Role::where("label", $label)->first();
        if(!$role) {
            $role = new \App\Role;
            $role->label = ucwords($label);
            $role->save();
        }
        return $role;

    }

     private function addOrFindGroupType($groupType) {
         if(is_array($groupType) && array_key_exists("label", $groupType)) {
             $label = $groupType["label"];
         }
         else {
             $label = $groupType;
         }
        $groupType = \App\GroupType::where("label", $label)->first();
        if(!$groupType) {
            $groupType = new \App\GroupType;
            $groupType->label = ucwords($label);
            $groupType->save();
        }
        return $groupType;

    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($group)
    {
        if(!$this->authorize('delete', $group)) {
            $returnData = array(
                'status' => 'error',
                'message' => "You don't have permission to edit this group"
            );
            return Response()->json($returnData, 500);
        }
        
        foreach($group->members as $member) {
            $member->end_date = \Carbon\Carbon::now();
            $member->save();
        }
        $group->active_group = 0;
        $group->save();
        return response()->json(["success"=>true]);
    }

    public function members($group, $hash=null) {

        if(!$this->authorize('view', $group) && ($hash != $group->hash)) {
            $returnData = array(
                'status' => 'error',
                'message' => "You don't have permission to access this group"
            );
            return Response()->json($returnData, 500);
        }
        else {
            $members = $group->members()->with('user','role')->get();
            return MembershipResource::collection($members);
        }
        
    }

    // get available roles for autocomplete.  Debating the samrter way to do this.
    public function roles() {
        $roles = DB::table('memberships')->select("role_id")
        ->groupBy("role_id")
        ->whereNull("end_date")
        ->havingRaw("COUNT(role_id) > " . config('consts.MINIMUM_ROLE_COUNT'))->get()->pluck("role_id")->toArray();
        
        $rolesLoaded = \App\Role::find($roles);

        $officialRoles = \App\Role::with('officialGroupType')->has('officialGroupType')->get();

        $merged = $rolesLoaded->merge($officialRoles);
        $sorted = $merged->sortBy("label")->values()->load("officialRoleCategory")->all();
        return response()->json($sorted);
    }

    public function role($role) {
        $role->load("members", "members.user", "members.role", "members.group");
        return response()->json($role);

    }
    // get available types for autocomplete.  Debating the samrter way to do this.
    public function types() {        
        $roles = DB::table('groups')->select("group_type_id")
        ->groupBy("group_type_id")
        ->havingRaw("COUNT(group_type_id) > " . config('consts.MINIMUM_ROLE_COUNT'))->get()->pluck("group_type_id")->toArray();
        
        $groupTypes = \App\GroupType::find($roles);

        return response()->json($groupTypes);
    }

    // get available parents for autocomplete.  Debating the samrter way to do this.
    public function parents() {        
        $groupTypes = \App\ParentOrganization::orderBy('group_title')->with("childOrganizationsRecursive")->whereNull("parent_organization_id")->get();

        return response()->json($groupTypes);
    }

    // get all of the groups including anyone who is flagged an active admin
    public function getGroupsWithAdmins() {
        $groups = \App\Group::where("active_group",1)->get()->load("groupType", "parentGroup", "childGroups", "parentOrganization", "artifacts", "activeMembers");
        $groups->load("activeMembers.user", "activeMembers.role");
        // only return members who are marked as admins
        $groups->transform(function($group) {
            $group->activeMembers = $group->activeMembers->filter(function($member) {
                return $member->admin;
            });
            return $group;
        });
        return response()->json($groups);
    }
}
