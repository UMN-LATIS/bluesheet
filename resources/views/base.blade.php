<!DOCTYPE html>
<html lang="en">

<head>
  <title>Groups</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta charset="UTF-8">
  <meta name="csrf-token" content="{{ csrf_token() }}">
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
