<div class="form-group {{ $errors->has('label') ? 'has-error' : ''}}">
    <label for="label" class="control-label">{{ 'Label' }}</label>
    <input class="form-control" name="label" type="text" id="label" value="{{ isset($grouptype->label) ? $grouptype->label : ''}}" >
    {!! $errors->first('label', '<p class="help-block">:message</p>') !!}
</div>


<div class="form-group">
    <input class="btn btn-primary" type="submit" value="{{ $formMode === 'edit' ? 'Update' : 'Create' }}">
</div>
