<?php
namespace Deployer;
// require 'contrib/laravel.php';
require 'contrib/npm.php';
require 'recipe/laravel.php';
require 'contrib/cachetool.php';

set('cachetool_args', '--tmp-dir=/var/www/bluesheet');
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
$devHost = 'cla-bluesheet-dev.oit.umn.edu';
$tstHost = 'cla-bluesheet-tst.oit.umn.edu';
$prodHost = 'cla-bluesheet-prd.oit.umn.edu';


host('dev')
  ->set('hostname', $devHost)
  ->set('remote_user', 'latis_deploy')
  ->set('labels', ['stage' => 'development'])
  // ->identityFile()
  ->set('deploy_path', '/var/www/bluesheet/');

host('stage')
  ->set('hostname', $tstHost)
  ->set('remote_user', 'latis_deploy')
  ->set('labels', ['stage' => 'stage'])
  // ->identityFile()
  ->set('deploy_path', '/var/www/bluesheet/');

host('prod')
  ->set('hostname', $prodHost)
  ->set('remote_user', 'latis_deploy')
  ->set('labels', ['stage' => 'production'])
  ->set('deploy_path', '/var/www/bluesheet/');



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
task('assets:generate', function () {
    cd('{{release_path}}');
    run('npm run build');
})->desc('Assets generation');
after('deploy:vendors', 'assets:generate');
after('artisan:migrate', 'artisan:queue:restart');

// clear any cached data, like cached instructor info,
before('artisan:config:cache', 'artisan:cache:clear');
after('deploy:symlink', 'cachetool:clear:opcache');