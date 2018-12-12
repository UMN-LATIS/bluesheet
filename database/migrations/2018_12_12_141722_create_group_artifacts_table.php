<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateGroupArtifactsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('group_artifacts', function (Blueprint $table) {
            $table->increments('id');
            $table->string("label");
            $table->string("target");
            $table->integer("group_id")->unsigned();
            $table->foreign("group_id")->references("id")->on("groups")->onDelete('cascade');;
            $table->timestamps();
        });

    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('group_artifacts');
    }
}
