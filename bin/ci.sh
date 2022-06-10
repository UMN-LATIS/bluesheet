#!/usr/bin/env bash

# Generate Key
php artisan key:generate

# Directory Permissions
php artisan storage:link
chmod -R 777 storage bootstrap/cache
php artisan config:clear
# php artisan config:cache
