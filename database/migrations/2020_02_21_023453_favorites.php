<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class Favorites extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create("favorite_groups", function(Blueprint $table) {
            $table->integer('group_id')->unsigned();
            $table->foreign('group_id')->references('id')->on('groups')->onDelete('cascade');
            $table->integer('user_id')->unsigned();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
        Schema::create("favorite_roles", function(Blueprint $table) {
            $table->integer('role_id')->unsigned();
            $table->foreign('role_id')->references('id')->on('roles')->onDelete('cascade');
            $table->integer('user_id')->unsigned();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('favorite_groups');
        Schema::dropIfExists('favorite_roles');
    }
}
