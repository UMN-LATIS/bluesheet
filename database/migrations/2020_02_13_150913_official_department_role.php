<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class OfficialDepartmentRole extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table("roles", function(Blueprint $table) {
            $table->boolean("official_department_role");
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
            // $table->dropColumn("official_department_role");
        });
    }
}
