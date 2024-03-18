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
  @vite(['resources/js/app.js'])

  <style>
    .impersonation-header {
      background-color: #c42da8;
      color: white;
    }

    .impersonation-header__inner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 90rem;
      padding: 0.5rem 1rem;
      margin: 0 auto;
    }
  </style>
</head>

<body>
  @impersonating($guard = null)
    <div class="impersonation-header">
      <div class="impersonation-header__inner">
        <div>{{ auth()->user()->displayName }}</div>

        <div>
          <a class="btn btn-outline-light" href="{{ route('impersonate.leave') }}">Leave impersonation</a>
        </div>
      </div>
    </div>
  @endImpersonating


  @yield('content')

  @yield('footer')

  <script>
    @auth
    window.Permissions = {!! json_encode(Auth::user()->allPermissions, true) !!};
    @else
      window.Permissions = [];
    @endauth
  </script>
</body>

</html>
