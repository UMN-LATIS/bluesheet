<?php
namespace Deployer;
// require 'contrib/laravel.php';
require 'contrib/npm.php';
require 'recipe/laravel.php';

// Configuration
set('ssh_type', 'native');
set('ssh_multiplexing', true);
set('update_code_strategy', 'clone');
set('repository', 'git@github.com:umn-latis/bluesheet.git');

add('shared_files', []);
add('shared_dirs', []);

add('writable_dirs', []);

// Servers

host('dev')
    ->setHostname("cla-groups-dev.oit.umn.edu")
    ->setRemoteUser('swadm')
    ->set('labels', ['stage' => 'development'])
    // ->identityFile()
    ->set('bin/php', '/opt/remi/php81/root/usr/bin/php')
	->set('deploy_path', '/swadm/var/www/html/');

host('stage')
    ->setHostname("cla-groups-tst.oit.umn.edu")
    ->setRemoteUser('swadm')
    ->set('labels', ['stage' => 'stage'])
    // ->identityFile()
    ->set('bin/php', '/opt/remi/php81/root/usr/bin/php')
    ->set('deploy_path', '/swadm/var/www/html/');

host('prod')
    ->setHostname("cla-groups-prd.oit.umn.edu")
    ->setRemoteUser('swadm')
    ->set('labels', ['stage' => 'production'])
    // ->identityFile()
    ->set('bin/php', '/opt/remi/php81/root/usr/bin/php')
	->set('deploy_path', '/swadm/var/www/html/');

task('assets:generate', function() {
  cd('{{release_path}}');
  run('npm run production');
})->desc('Assets generation');

task('fix_storage_perms', function() {
    cd('{{release_path}}');
    run('touch storage/logs/laravel.log', no_throw: true );
    run('sudo chown apache storage/logs/laravel.log');
    run('sudo chgrp apache storage/logs/laravel.log');
})->desc("Fix Apache Logs");

after('artisan:migrate', 'fix_storage_perms');


// [Optional] if deploy fails automatically unlock.
after('deploy:failed', 'deploy:unlock');

after('deploy:update_code', 'deploy:git:submodules');
task('deploy:git:submodules', function () {
    $git = get('bin/git');

    cd('{{release_path}}');
    run("$git submodule update --init");
});

// Migrate database before symlink new release.

before('deploy:symlink', 'artisan:migrate');
after('deploy:update_code', 'npm:install');
after('npm:install', 'assets:generate');
after('artisan:migrate', 'artisan:queue:restart');
