<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class InitialTableStructure extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
         Schema::create('users', function (Blueprint $table) {
            $table->increments('id');
            $table->string('givenname')->nullable();
            $table->string('surname')->nullable();
            $table->string('displayName')->nullable();
            $table->string('email')->nullable();
            $table->string('umndid')->nullable();
            $table->string('office')->nullable();
            $table->string('phone')->nullable();
            $table->integer("site_permissions")->default(100);
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('group_types', function (Blueprint $table) { 
            $table->increments('id');
            $table->string('group_type');
        });

        Schema::create('groups', function (Blueprint $table) {
            $table->increments('id');
            $table->string('group_title');
            $table->integer('group_type_id')->unsigned();
            $table->foreign('group_type_id')->references('id')->on('group_types');
            $table->integer('parent_group_id')->unsigned()->nullable();
            $table->foreign('parent_group_id')->references('id')->on('groups');
            $table->boolean('private_group')->default(false);
            $table->boolean('active_group')->default(true);
            $table->dateTime('start_date')->nullable();
            $table->dateTime('end_date')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('roles', function (Blueprint $table) { 
            $table->increments('id');
            $table->string('label');
            $table->timestamps();
        });

        Schema::create('memberships', function (Blueprint $table) { 
            $table->integer('group_id')->unsigned();
            $table->foreign('group_id')->references('id')->on('groups')->onDelete('cascade');
            $table->integer('user_id')->unsigned();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->integer('role_id')->unsigned();
            $table->foreign('role_id')->references('id')->on('roles');
            $table->dateTime("start_date")->nullable();
            $table->dateTime("end_date")->nullable();
            $table->text("notes")->nullable();
            $table->boolean('admin')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });



    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        
        Schema::dropIfExists('memberships');
        Schema::dropIfExists('roles');
        Schema::dropIfExists('groups');
        Schema::dropIfExists('group_types');
        Schema::dropIfExists('users');
    }
}
