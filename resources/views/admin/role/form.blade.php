<div class="form-group {{ $errors->has('label') ? 'has-error' : ''}}">
    <label for="label" class="control-label">{{ 'Label' }}</label>
    <input class="form-control" name="label" type="text" id="label" value="{{ isset($role->label) ? $role->label : ''}}" >
    {!! $errors->first('label', '<p class="help-block">:message</p>') !!}
</div>



<div class="form-group {{ $errors->has('official_role_category_id') ? 'has-error' : ''}}">
    <label for="official_role_category_id" class="control-label">{{ 'Official Role Category' }}</label>
    <select class="form-control" name="official_role_category_id" id="official_role_category_id">
        <option value="">None</option>
        @foreach ( \App\OfficialRoleCategory::all() as $orc)
        <option value="{{$orc->id}}" {{ ($role->official_role_category_id == $orc->id)?"SELECTED":null }}>{{ $orc->category }}</option>
        @endforeach
  </select>
    {!! $errors->first('official_role_category_id', '<p class="help-block">:message</p>') !!}
</div>

<div class="form-group">
  <label for="">Official Role Group Type</label>
  <select class="form-control" name="groupType[]" id="" multiple size=10>
      <option></option>
    @foreach ( \App\GroupType::all() as $groupType)
    <option value={{ $groupType->id }} {{ ($role->officialGroupType->contains($groupType->id))?"SELECTED":null }}>{{ $groupType->label }}</option>

    @endforeach
    </select>
</div>




<div class="form-group">
    <input class="btn btn-primary" type="submit" value="{{ $formMode === 'edit' ? 'Update' : 'Create' }}">
</div>
