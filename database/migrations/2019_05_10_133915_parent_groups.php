<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class ParentGroups extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table("groups", function(Blueprint $table) {
            $table->integer("parent_group_id")->unsigned()->nullable();
            $table->foreign('parent_group_id')->references('id')->on('groups');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table("groups", function(Blueprint $table) {
            $table->dropForeign('groups_parent_group_id_foreign');
            $table->dropColumn("parent_group_id");
        });
    }
}
