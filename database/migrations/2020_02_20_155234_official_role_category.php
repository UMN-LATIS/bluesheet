<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class OfficialRoleCategory extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create("official_role_categories", function(Blueprint $table) {
            $table->increments('id');
            $table->string("category");
        });

        Schema::table("roles", function(Blueprint $table) {
            $table->integer("official_role_category_id")->unsigned()->nullable();
            $table->foreign("official_role_category_id")->references("id")->on("official_role_categories");
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table("roles", function(Blueprint $table) { 
            $table->dropForeign("roles_official_role_category_id_foreign");
            $table->dropColumn("official_role_category_id");
        });

        Schema::dropIfExists('official_role_categories');
    }
}
