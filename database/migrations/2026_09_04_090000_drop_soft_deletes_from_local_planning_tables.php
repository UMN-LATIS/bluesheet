<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Drops soft deletes from the two local planning tables and puts the section
 * and course keys back on the live rows.
 *
 * A nullable deleted_at inside a unique key exempts every row that holds one,
 * and deleted_at IS NULL is the definition of a live row, so the keys created
 * with these tables constrained nothing a scheduler could reach. Two live
 * sections could carry the same number.
 *
 * Nothing read the deleted rows: the planner has no undelete, and the section
 * a scheduler removes is recorded in the audits table with its old values and
 * whoever removed it. Keeping the row as well bought a second, worse copy of
 * that record and cost the constraint.
 *
 * Rolling back restores the columns and the old keys but not the rows this
 * drops. Their values are in the audits table.
 */
return new class extends Migration {
    public function up(): void {
        $this->assertLiveRowsAreUnique();

        // These rows stay deleted. Dropping the column without this would put
        // every one of them back in the plan, and any that shared a number
        // with a live section would then break the new key. Their meetings
        // and instructors go with them, by the cascade on those tables.
        DB::table('local_class_sections')->whereNotNull('deleted_at')->delete();
        DB::table('local_courses')->whereNotNull('deleted_at')->delete();

        Schema::table('local_class_sections', function (Blueprint $table) {
            $table->dropUnique('local_class_sections_unique');
            $table->dropSoftDeletes();
            $table->unique(
                ['term_code', 'course_code', 'class_section'],
                'local_class_sections_unique'
            );
        });

        Schema::table('local_courses', function (Blueprint $table) {
            $table->dropUnique('local_courses_unique');
            $table->dropSoftDeletes();
            $table->unique(['academic_org', 'course_code'], 'local_courses_unique');
        });
    }

    public function down(): void {
        Schema::table('local_class_sections', function (Blueprint $table) {
            $table->dropUnique('local_class_sections_unique');
            $table->softDeletes();
            $table->unique(
                ['term_code', 'course_code', 'class_section', 'deleted_at'],
                'local_class_sections_unique'
            );
        });

        Schema::table('local_courses', function (Blueprint $table) {
            $table->dropUnique('local_courses_unique');
            $table->softDeletes();
            $table->unique(['academic_org', 'course_code', 'deleted_at'], 'local_courses_unique');
        });
    }

    /**
     * Refuses the whole migration while a key it is about to create already
     * has two live rows under it. The old keys never constrained live rows,
     * so this is the state they were free to reach.
     *
     * Checked before anything is dropped because MariaDB does not roll DDL
     * back: a collision found while adding the key would leave the table
     * without its old key, without deleted_at, and with no record that this
     * migration ran.
     */
    private function assertLiveRowsAreUnique(): void {
        $duplicates = collect([
            'local_class_sections' => ['term_code', 'course_code', 'class_section'],
            'local_courses' => ['academic_org', 'course_code'],
        ])->flatMap(fn(array $key, string $table) => DB::table($table)
            ->whereNull('deleted_at')
            ->groupBy($key)
            ->havingRaw('count(*) > 1')
            ->get($key)
            ->map(fn($row) => $table . ': ' . implode(' ', (array) $row)));

        if ($duplicates->isEmpty()) {
            return;
        }

        throw new RuntimeException(
            "These rows already break the keys this migration adds:\n  "
            . $duplicates->implode("\n  ")
            . "\nRemove the duplicates, then run the migration again."
        );
    }
};
