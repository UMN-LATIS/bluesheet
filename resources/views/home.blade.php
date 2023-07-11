@extends('base')

@section('content')
	<App></App>
@endsection

@section('header')
	<script>
		window.showTour = {!! json_encode($showTour) !!};
	</script>
@endsection
