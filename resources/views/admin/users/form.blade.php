<div class="form-group {{ $errors->has('displayName') ? 'has-error' : ''}}">
    <label for="name" class="control-label">{{ 'Display Name' }}</label>
    <input class="form-control" name="displayName" type="text" id="displayName" value="{{ isset($user->displayName) ? $user->displayName : ''}}" >
    {!! $errors->first('name', '<p class="help-block">:message</p>') !!}
</div>
<div class="form-group {{ $errors->has('email') ? 'has-error' : ''}}">
    <label for="email" class="control-label">{{ 'Email' }}</label>
    <input class="form-control" rows="5" name="email" type="textarea" id="email" value="{{ isset($user->email) ? $user->email : ''}}">
    {!! $errors->first('email', '<p class="help-block">:message</p>') !!}
</div>

<div class="form-group {{ $errors->has('id') ? 'has-error' : ''}}">
    <label for="id" class="control-label">{{ 'Id' }}</label>
    <input class="form-control" name="id" type="number" id="id" value="{{ isset($user->id) ? $user->id : ''}}" >
    {!! $errors->first('id', '<p class="help-block">:message</p>') !!}
</div>

<div class="form-group">
  <label for="">Roles</label>
  <select class="form-control" name="roles[]" id="">
    @foreach ( \Spatie\Permission\Models\Role::all() as $role)
    <option value={{ $role->id }} {{ ($user->roles->contains($role->id))?"SELECTED":null }}>{{ $role->name }}</option>

    @endforeach
    </select>
</div>

<div class="form-group">
  <label for="">Permissions</label>
  <select class="form-control" name="permissions[]" id="" multiple>
    @foreach ( \Spatie\Permission\Models\Permission::all() as $permission)
    <option value={{ $permission->id }} {{ ($user->permissions->contains($permission->id))?"SELECTED":null }}>{{ $permission->name }}</option>
  
    @endforeach
    </select>
</div>

<div class="form-group">
    <input class="btn btn-primary" type="submit" value="{{ $formMode === 'edit' ? 'Update' : 'Create' }}">
</div>
