<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean("ssl_eligible")->default(false);
            $table->boolean("midcareer_eligible")->default(false);
            $table->boolean("ssl_apply_eligible")->default(false);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn("ssl_eligible");
            $table->dropColumn("midcareer_eligible");
            $table->dropColumn("ssl_apply_eligible");
        });
    }
};
