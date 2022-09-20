<!DOCTYPE html>
<html lang="en">

<head>
  <title>Groups</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta charset="UTF-8">
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,400;0,600;0,700;1,400&display=swap"
    rel="stylesheet">
  <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.6.0/css/all.css"
    integrity="sha384-aOkxzJ5uQz7WBObEZcHvV5JvRW3TUc2rNPA7pe3AwnsUohiw1Vj2Rgx2KSOkF5+h" crossorigin="anonymous">
  <link href="{{ mix('css/app.css') }}" rel="stylesheet" type="text/css">
</head>

<body>
  <span id="app">
    @yield('content')
  </span>
  @impersonating
    <a class="" href="/impersonate/leave">End Impersonation</a>
  @endImpersonating
  @yield('footer')

  <script>
    @auth
    window.Permissions = {!! json_encode(Auth::user()->allPermissions, true) !!};
    @else
      window.Permissions = [];
    @endauth
  </script>
  <script src="{{ mix('js/app.js') }}"></script>
</body>

</html>
