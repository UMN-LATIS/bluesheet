<!DOCTYPE html>
<html lang="en">
<head>
	<title>Groups</title>
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<meta charset="UTF-8">
	<meta name="csrf-token" content="{{ csrf_token() }}">
		{{-- <link href="https://fonts.googleapis.com/css?family=Amatic+SC" rel="stylesheet"> --}}
		{{-- <link href="https://fonts.googleapis.com/css?family=Itim" rel="stylesheet"> --}}
	<link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.6.0/css/all.css" integrity="sha384-aOkxzJ5uQz7WBObEZcHvV5JvRW3TUc2rNPA7pe3AwnsUohiw1Vj2Rgx2KSOkF5+h" crossorigin="anonymous">
	@vite('resources/css/app.css')
	<span id="app">
	@yield('content')
	</span>
            @impersonating
            <a class="" href="/impersonate/leave">End Impersonation</a>
            @endImpersonating
						
				<script>
					@auth
						window.Permissions = {!! json_encode(Auth::user()->allPermissions, true) !!};
					@else
						window.Permissions = [];
					@endauth
				</script>
				@vite('resources/js/app.js')
				
				@yield('footer')

				</html>
