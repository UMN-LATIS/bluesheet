<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class ParentOrganization extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('parent_organizations', function (Blueprint $table) {
            $table->increments('id');
            $table->string('group_title');
        });

        Schema::table('groups', function (Blueprint $table) {
            $table->dropForeign('groups_parent_group_id_foreign');
            $table->dropColumn('parent_group_id');
            $table->integer('parent_organization_id')->unsigned()->nullable();
            $table->foreign('parent_organization_id')->references('id')->on('parent_organizations');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        
        Schema::table('groups', function (Blueprint $table) {
            $table->dropForeign('groups_parent_organization_id_foreign');
            $table->dropColumn('parent_organization_id');
            $table->integer('parent_group_id')->unsigned()->nullable();
            $table->foreign('parent_group_id')->references('id')->on('groups');
        });
        Schema::drop('parent_organizations');
    }
}
