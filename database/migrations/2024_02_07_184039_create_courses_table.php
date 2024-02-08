<?php

use App\Group;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void {
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->string('title');

            // group_id is an old unsigned int type
            $table->unsignedInteger('group_id');
            $table->foreign('group_id')->references('id')->on('groups');

            $table->string('subject');
            $table->string('catalog_number');
            $table->string('type');
            $table->string('level');
            $table->timestamps();

            $table->unique(['group_id', 'subject', 'catalog_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void {
        Schema::dropIfExists('courses');
    }
};
