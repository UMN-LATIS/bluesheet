<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests;

use App\GroupType;
use Illuminate\Http\Request;

class GroupTypeController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\View\View
     */
    public function index(Request $request)
    {
        $keyword = $request->get('search');
        $perPage = 25;

        if (!empty($keyword)) {
            $grouptype = GroupType::where('label', 'LIKE', "%$keyword%");
        } else {
            $grouptype = GroupType::all();
        }

        return view('admin.group-type.index', compact('grouptype'));
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\View\View
     */
    public function create()
    {
        return view('admin.group-type.create');
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param \Illuminate\Http\Request $request
     *
     * @return \Illuminate\Http\RedirectResponse|\Illuminate\Routing\Redirector
     */
    public function store(Request $request)
    {
        
        $requestData = $request->all();
        
        GroupType::create($requestData);

        return redirect('admin/group-type')->with('flash_message', 'GroupType added!');
    }

    /**
     * Display the specified resource.
     *
     * @param  int  $id
     *
     * @return \Illuminate\View\View
     */
    public function show($id)
    {
        $grouptype = GroupType::findOrFail($id);

        return view('admin.group-type.show', compact('grouptype'));
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  int  $id
     *
     * @return \Illuminate\View\View
     */
    public function edit($id)
    {
        $grouptype = GroupType::findOrFail($id);

        return view('admin.group-type.edit', compact('grouptype'));
    }

    /**
     * Update the specified resource in storage.
     *
     * @param \Illuminate\Http\Request $request
     * @param  int  $id
     *
     * @return \Illuminate\Http\RedirectResponse|\Illuminate\Routing\Redirector
     */
    public function update(Request $request, $id)
    {
        
        $requestData = $request->all();
        
        $grouptype = GroupType::findOrFail($id);
        $grouptype->update($requestData);

        return redirect('admin/group-type')->with('flash_message', 'GroupType updated!');
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     *
     * @return \Illuminate\Http\RedirectResponse|\Illuminate\Routing\Redirector
     */
    public function destroy($id)
    {
        GroupType::destroy($id);

        return redirect('admin/group-type')->with('flash_message', 'GroupType deleted!');
    }
}
