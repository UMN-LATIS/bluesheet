# Bluesheet

> Track membership and roles within various groups, committees, taskforces, and departments at UMN.

- aka: groups.cla.umn.edu
- aka: caligari

## Set Up

Blue Sheeet uses Laravel's docker environment, [Laravel Sail](https://laravel.com/docs/8.x/sail) for development.

Prereqs:

- Docker
- PHP v7.4
- Composer
- Node LTS

To get started:

```sh
# Create a .env file
cp .env.example .env

# Install php dependencies
composer install

# Start Sail
sail up

# create app key, link storage, etc
sail exec app ./bin/ci.sh

# migrate the database
sail artisan migrate:fresh --seed

# Install node modules
yarn install

# Start Vite
yarn dev

```

The application will be running on <http://localhost>.

## Using the Application

```sh
sail up
yarn dev
```

Load <http://localhost> in your browser.

Login with:

- username: `admin`
- password: `admin`

Additional users can be configured in `config/shibboleth.php`.

Stop the application: `sail down`.

## Local Development with Bandaid

Some features of BlueSheet require access to [Bandaid](https://github.com/UMN-LATIS/Bandaid) API (e.g. the Scheduling Report).

To connect to Bandaid for local development:

1. Connect to UMN VPN.
2. Login to <https://cla-bandaid-prd-web.oit.umn.edu/admin>
3. In Bandaid, add a new API Token for your user: Users > `username` > Edit > Add Token.
4. Add the token in `.env` as `BANDAID_KEY=<your token>`
5. Get your VPN ip address from https://z.umn.edu/ip
6. Add your ip address to Bandaid's Allow List. (You'll need to do this each time your ip address changes. Be sure to remove the old ip address from the list.)

## Deploy

| Enviroment Name | URL                                  |
| --------------- | ------------------------------------ |
| `dev`           | <https://cla-groups-dev.oit.umn.edu> |
| `stage`         | <https://cla-groups-tst.oit.umn.edu> |
| `prod`          | <https://cla-groups-prd.oit.umn.edu> |

```sh
./vendor/bin/dep deploy <environment name>
```
