<?php
namespace Deployer;
// require 'contrib/laravel.php';
require 'contrib/yarn.php';
require 'recipe/laravel.php';

// Configuration
set('ssh_type', 'native');
set('ssh_multiplexing', true);
set('git_ssh_command', 'ssh -o StrictHostKeyChecking=no');
set('update_code_strategy', 'clone');
set('repository', 'git@github.com:umn-latis/bluesheet.git');

add('shared_files', []);
add('shared_dirs', []);

add('writable_dirs', []);

// Servers
$devHost = 'cla-groups-dev.oit.umn.edu';
$tstHost = 'cla-groups-tst.oit.umn.edu';
$prodHost = 'cla-groups-prd.oit.umn.edu';
$phpPath = '/opt/remi/php81/root/usr/bin/php';

host('dev')
  ->set('hostname', $devHost)
  ->set('remote_user', 'swadm')
  ->set('labels', ['stage' => 'development'])
  // ->identityFile()
  ->set('bin/php', $phpPath)
  ->set('deploy_path', '/swadm/var/www/html/');

host('stage')
  ->set('hostname', $tstHost)
  ->set('remote_user', 'swadm')
  ->set('labels', ['stage' => 'stage'])
  // ->identityFile()
  ->set('bin/php', $phpPath)
  ->set('deploy_path', '/swadm/var/www/html/');

host('prod')
  ->set('hostname', $prodHost)
  ->set('remote_user', 'swadm')
  ->set('labels', ['stage' => 'production'])
  ->set('bin/php', $phpPath)
  ->set('deploy_path', '/swadm/var/www/html/');

task('assets:generate', function() {
  cd('{{release_path}}');
  run('yarn build');
})->desc('Assets generation');


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
after('deploy:update_code', 'yarn:install');
after('yarn:install', 'assets:generate');
after('artisan:migrate', 'artisan:queue:restart');

// clear any cached data, like cached instructor info,
before('artisan:config:cache', 'artisan:cache:clear');
