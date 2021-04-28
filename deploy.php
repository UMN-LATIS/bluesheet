<?php
namespace Deployer;
require 'recipe/laravel.php';
require 'recipe/npm.php';

// Configuration
set('ssh_type', 'native');
set('ssh_multiplexing', true);

set('repository', 'git@github.umn.edu:mcfa0086/caligari.git');

add('shared_files', []);
add('shared_dirs', []);

add('writable_dirs', []);

// Servers

host('dev')
    ->hostname("cla-groups-dev.oit.umn.edu")
    ->user('mcfa0086')
    ->stage('development')
    // ->identityFile()
    ->set('bin/php', '/opt/rh/rh-php73/root/usr/bin/php')
	->set('deploy_path', '/swadm/var/www/html/');

host('stage')
    ->hostname("cla-groups-tst.oit.umn.edu")
    ->user('mcfa0086')
    ->stage('stage')
    // ->identityFile()
    ->set('bin/php', '/opt/rh/rh-php73/root/usr/bin/php')
    ->set('deploy_path', '/swadm/var/www/html/');

host('prod')
    ->hostname("cla-groups-prd.oit.umn.edu")
    ->user('mcfa0086')
    ->stage('production')
    // ->identityFile()
    ->set('bin/php', '/opt/rh/rh-php73/root/usr/bin/php')
	->set('deploy_path', '/swadm/var/www/html/');

task('assets:generate', function() {
  cd('{{release_path}}');
  run('npm run production');
})->desc('Assets generation');


// $result = run("scl enable rh-php56 'php -v'");
// Tasks

// desc('Restart PHP-FPM service');
// task('php-fpm:restart', function () {
//     // The user must have rights for restart service
//     // /etc/sudoers: username ALL=NOPASSWD:/bin/systemctl restart php-fpm.service
//     run('sudo systemctl restart php-fpm.service');
// });
// after('deploy:symlink', 'php-fpm:restart');

// [Optional] if deploy fails automatically unlock.
after('deploy:failed', 'deploy:unlock');

// Migrate database before symlink new release.

before('deploy:symlink', 'artisan:migrate');
after('deploy:update_code', 'npm:install');
after('npm:install', 'assets:generate');
after('artisan:migrate', 'artisan:queue:restart');
