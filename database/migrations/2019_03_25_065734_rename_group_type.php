<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class RenameGroupType extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table("group_types", function(Blueprint $table) {
            $table->renameColumn("group_type", "label");
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table("group_types", function(Blueprint $table) {
            $table->renameColumn("label", "group_type");
        });
    }
}
