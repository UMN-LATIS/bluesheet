@extends('base')

@section('content')
	<home :userperms="{{ Auth::user()->site_permissions }}"></home>
@endsection