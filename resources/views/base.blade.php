<!DOCTYPE html>
<html lang="en">

<head>
    <title>BlueSheet</title>
    <!--	None of this mobile stuff will work if you don't use a viewport meta tag -->
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta charset="UTF-8">
    <meta name="csrf-token" content="{{ csrf_token() }}">


    <link href="https://fonts.googleapis.com/css?family=Open+Sans:300,400,600,700" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css?family=Amatic+SC" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css?family=Itim" rel="stylesheet">
    <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.6.0/css/all.css"
        integrity="sha384-aOkxzJ5uQz7WBObEZcHvV5JvRW3TUc2rNPA7pe3AwnsUohiw1Vj2Rgx2KSOkF5+h" crossorigin="anonymous">
    <link href="{{ mix('css/app.css') }}" rel="stylesheet" type="text/css">

    @yield('header')
</head>

<body>
    @include("header")

    <a name="main-nav"></a>
    <a name="main-content"></a>

    <main role="main" class="main-content">
        <div class="home layout-content" id="app">
			<div class="region region--content clearfix">
				<div class="region__inner">
					<div class="block block-system block-system-main-block">
						<div class="group group--full group--unit">
            				@yield('content')
						</div>
					</div>
				</div>
			</div>
        </div>
        @impersonating
        <a class="" href="/impersonate/leave">End Impersonation</a>
        @endImpersonating
    </main>
    @include('footer')
</body>

<script>
					@auth
						window.Permissions = {!! json_encode(Auth::user()->allPermissions, true) !!};
					@else
						window.Permissions = [];
					@endauth
				</script>
<script src="{{ mix('js/app.js') }}"></script>

@yield('footer')

</html>
