# Bluesheet

> Track membership and roles within various groups, committees, taskforces, and departments at UMN.

- aka: groups.cla.umn.edu
- aka: caligari

## Set Up

Blue Sheeet uses Laravel's docker environment, [Laravel Sail](https://laravel.com/docs/8.x/sail) for development.

To get started:

```sh
# Create a .env file
cp .env.example .env

# create auth.json for Nova credentials
cp auth.json.example auth.json

# add your username/key to auth.json

# Install php dependencies
composer install

# Start Sail
sail up

# create app key, link storage, etc
sail exec app ./bin/ci.sh

# setup local db
sail artisan migrate:fresh --seed

# Install node modules
npm install

# Start Vite
npm run dev

```

The application will be running on <http://localhost>.

## Using the Application

```sh
sail up
npm run dev
```

Load <http://localhost> in your browser.

Login with:

- username: `admin`
- password: `admin`

Additional users can be configured in `config/shibboleth.php`.

Stop the application: `sail down`.

## Running Tests

```sh
# PHP feature tests
sail pest

# JS unit tests
npm run test:unit

# end to end tests, with the app running
npm run test:e2e
```

Pest uses its own `testing` database, so running it leaves your development
data alone. Sail creates that database the first time the MariaDB container
starts. A container older than that change will not have it, so create it once:

```sh
docker compose exec mariadb mariadb -uroot -ppassword -e "CREATE DATABASE IF NOT EXISTS testing"
```

## Local Development with Bandaid

Some features of BlueSheet require access to [Bandaid](https://github.com/UMN-LATIS/Bandaid) API (e.g. the Faculty Leaves Planning Report page).

To connect to Bandaid for local development:

1. Connect to UMN VPN.
2. Login to <https://bandaid.cla.umn.edu/admin>
3. In Bandaid, add a new API Token for your user: Users > `username` > Edit > Add Token.
4. Add the token in `.env` as `BANDAID_KEY=<your token>`
5. Get your VPN ip address from https://z.umn.edu/ip
6. Add your ip address to Bandaid's Allow List. (You'll need to do this each time your ip address changes. Be sure to remove the old ip address from the list.)

The seeded Anthropology and Psychology groups carry real department ids, so
once your key is in place those two load actual courses and employees.

## Local Development with LDAP

User lookup and autocomplete read UMN's LDAP directory, which needs a password
in `LDAP_PASSWORD`. Ask the team for one if you need those features. Without
it, lookups return nothing and everything else behaves normally.

## Deploy

| Enviroment Name | URL                                     |
| --------------- | --------------------------------------- |
| `dev`           | <https://cla-bluesheet-dev.oit.umn.edu> |
| `stage`         | <https://cla-bluesheet-tst.oit.umn.edu> |
| `prod`          | <https://bluesheet.cla.umn.edu>         |

```sh
./vendor/bin/dep deploy <environment name>
```

## Documentation

BlueSheet documentation is in the `docs` folder, and published at <https://umn-latis.github.io/bluesheet/>. It uses [VitePress](https://vitepress.vuejs.org/) for static site generation.

To develop locally:

```sh
cd docs
npm install
npm run docs:dev
```

Building the documentation:

```sh
cd docs
npm run docs:build
```

and publishing:

```sh
cd docs
npm run docs:publish
```
