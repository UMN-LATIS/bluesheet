<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class NestedOrganizations extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('parent_organizations', function(Blueprint $table) {
            $table->integer("parent_organization_id")->unsigned()->nullable();
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
        Schema::table('parent_organizations', function(Blueprint $table) {
            $table->dropForeign('parent_organizations_parent_organization_id_foreign');
            $table->dropColumn('parent_organization_id');
        });
    }
}
