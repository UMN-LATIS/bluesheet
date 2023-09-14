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

## Deploy

| Enviroment Name | URL                                  |
| --------------- | ------------------------------------ |
| `dev`           | <https://cla-groups-dev.oit.umn.edu> |
| `stage`         | <https://cla-groups-tst.oit.umn.edu> |
| `prod`          | <https://cla-groups-prd.oit.umn.edu> |

```sh
./vendor/bin/dep deploy <environment name>
```
