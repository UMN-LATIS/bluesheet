@extends('base')

@section('content')
  <div id="app"></div>
@endsection

@section('header')
  <script>
    window.showTour = {!! json_encode($showTour) !!};
  </script>
@endsection
