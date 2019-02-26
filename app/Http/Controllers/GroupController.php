<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Resources\Group as GroupResource;
use DB;
use Auth;

class GroupController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {

         return GroupResource::collection(\App\Group::all());
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        if(Auth::user()->site_permissions < 100) {
             $returnData = array(
                'status' => 'error',
                'message' => "You don't have permission to create a group"
            );
            return Response()->json($returnData, 500);
        }

        $newGroup = new \App\Group;
        $newGroup->group_title = $request->get("groupName");
        $newGroup->group_type_id = $request->get("groupType");
        $newGroup->parent_organization_id = $request->get("parentOrganization");
        $newGroup->active_group = 1;
        $newGroup->save();
        $returnData = array(
            'status' => 'success',
            'id' => $newGroup->id
        );

        $newMember = new \App\Membership;
        $newMember->user()->associate(Auth::user());
        $role = $this->addOrFindRole("member");
        $newMember->role()->associate($role);
        $newMember->start_date = \Carbon\Carbon::now();
        $newMember->admin = true;
        $newGroup->members()->save($newMember);
        return Response()->json($returnData);
    }

    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($group)
    {
        if(!$group->activeUsers()->contains(Auth::user()) && Auth::user()->site_permissions < 200) {

        }
        else {
            return new GroupResource($group);    
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
        if(!$group->userCanEdit(Auth::user())) {
            $returnData = array(
                'status' => 'error',
                'message' => "You don't have permission to edit this group"
            );
            return Response()->json($returnData, 500);
        }

        $group->fill($request->all());

        $group->group_type_id = $request->get("group_type")["id"];
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
                $newArtifact = new \App\GroupArtifact;
                $newArtifact->fill($artifact);
                $group->artifacts()->save($newArtifact);
                $foundArtifactIds[] = $newArtifact->id;
            }
        }

        foreach($group->artifacts as $artifact) {
            if(!in_array($artifact->id, $foundArtifactIds)) {
                $artifact->delete();
            }
        }


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
                    $role = $this->addOrFindRole($member['role']['label']);
                    $newMember->role()->associate($role);
                }
                else {
                    $role = $member['role']['id'];
                    $newMember->role_id = $role;
                }
                
                $group->members()->save($newMember);
            }

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

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($group)
    {
        if(!$group->userCanEdit(Auth::user())) {
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

    // get available roles for autocomplete.  Debating the samrter way to do this.
    public function roles() {
        $roles = DB::table('memberships')->select("role_id")
        ->groupBy("role_id")
        ->whereNotNull("end_date")
        ->havingRaw("COUNT(role_id) > " . config('consts.MINIMUM_ROLE_COUNT'))->get()->pluck("role_id")->toArray();
        
        $rolesLoaded = \App\Role::find($roles);

        return response()->json($rolesLoaded);
    }
    // get available types for autocomplete.  Debating the samrter way to do this.
    public function types() {        
        $groupTypes = \App\GroupType::all();

        return response()->json($groupTypes);
    }

    // get available parents for autocomplete.  Debating the samrter way to do this.
    public function parents() {        
        $groupTypes = \App\ParentOrganization::orderBy('group_title')->with("childOrganizationsRecursive")->whereNull("parent_organization_id")->get();

        return response()->json($groupTypes);
    }
}
