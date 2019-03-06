@extends('base')

@section('content')
	<home :userperms="{{ Auth::user()?Auth::user()->site_permissions:0 }}"></home>
@endsection