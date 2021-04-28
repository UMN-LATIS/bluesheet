@extends('base')

@section('content')

	<home></home>
@endsection

@section('header')
	<script>
		window.showTour = {!! json_encode($showTour) !!};
	</script>
@endsection