<?php

namespace App\Console\Commands;

use App\Group;
use App\Library\Bandaid;
use App\Library\Sis\ClassRecordTransformer;
use App\Library\Sis\CourseRecordDeriver;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * Rebuilds the sis_ mirror from scratch on every run: fill fresh _tmp copies
 * of the tables beside the live ones, one department at a time, then swap
 * the copies in with a single RENAME TABLE. Until the swap nothing touches
 * the live tables, so a failure anywhere aborts the run with the previous
 * mirror still in place. At worst a leftover _tmp table is dropped at the
 * start of the next run.
 */
class ImportSisData extends Command {
    protected $signature = 'import:sis';

    protected $description = 'Mirror Bandaid terms, departments, people and classes into the sis_ tables';

    /**
     * Bandaid's names endpoint takes a batch of emplids. A few thousand people
     * across CLA split into a handful of requests at this size.
     */
    private const NAMES_CHUNK_SIZE = 500;

    /** Bluesheet covers only the Twin Cities campus. */
    private const INSTITUTION = 'UMNTC';

    /** Every table here is rebuilt and swapped in together. */
    private const TABLES = [
        'sis_terms',
        'sis_departments',
        'sis_appointments',
        'sis_employees',
        'sis_courses',
        'sis_class_sections',
        'sis_class_instructors',
        'sis_class_meetings',
    ];

    private Bandaid $bandaid;
    private ClassRecordTransformer $transformer;
    private CourseRecordDeriver $courseDeriver;

    public function handle(): int {
        $this->bandaid = new Bandaid();
        $this->transformer = new ClassRecordTransformer();
        $this->courseDeriver = new CourseRecordDeriver();

        $departments = $this->deptIdsToImport();

        if ($departments->isEmpty()) {
            $this->error('No groups have a numeric dept_id. Nothing to import.');
            return Command::FAILURE;
        }

        try {
            $this->buildTmpTables();

            // appointments and instructors are written by department before
            // employees is populated at the end, so their emplid foreign key
            // would reject rows it hasn't caught up to yet without this
            $emplids = collect();
            Schema::withoutForeignKeyConstraints(function () use ($departments, &$emplids) {
                $this->importTerms();
                $this->importDepartments($departments->keys());
                $emplids = $this->importClassesAndAppointments($departments);
                $this->importEmployees($emplids);
            });

            // an empty build never replaces a populated mirror
            $sectionCount = DB::table('sis_class_sections_tmp')->count();
            if ($sectionCount === 0) {
                $this->error('Bandaid returned no class sections at all, previous data kept.');
                return Command::FAILURE;
            }

            $this->swapInTmpTables();
        } catch (\Throwable $e) {
            Log::error("import:sis failed: {$e->getMessage()}");
            $this->error("Import failed, previous data kept: {$e->getMessage()}");
            return Command::FAILURE;
        }

        $this->info("Done. {$sectionCount} sections across {$departments->count()} departments.");

        return Command::SUCCESS;
    }

    /**
     * Department ids to import, with the groups that supplied them.
     *
     * dept_id is a free text column, so it holds typos and placeholder text
     * alongside real ids. Anything non-numeric is reported by group rather than
     * dropped in silence, because a typo there means that department never
     * imports and nothing else would say so.
     *
     * @return Collection<string, string> dept_id => group names
     */
    private function deptIdsToImport() {
        $groups = Group::whereNotNull('dept_id')->get(['id', 'group_title', 'dept_id']);

        [$usableGroups, $unusableGroups] = $groups->partition(
            fn(Group $group) => is_numeric(trim((string) $group->dept_id))
        );

        foreach ($unusableGroups as $group) {
            $this->warn("  skipping group {$group->id} \"{$group->group_title}\": dept_id \"{$group->dept_id}\" is not a number");
        }

        return $usableGroups
            ->groupBy(fn(Group $group) => trim((string) $group->dept_id))
            ->map(fn($groups) => $groups->pluck('group_title')->implode(', '));
    }

    private function buildTmpTables(): void {
        // dropping one side of a foreign key before the other is rejected;
        // _old/_tmp leftovers from a previous run can reference each other
        Schema::withoutForeignKeyConstraints(function () {
            foreach (self::TABLES as $table) {
                // _old is a leftover only when a previous run died mid-swap
                Schema::dropIfExists("{$table}_old");
                Schema::dropIfExists("{$table}_tmp");
            }
        });

        foreach (self::TABLES as $table) {
            DB::statement("CREATE TABLE {$table}_tmp LIKE {$table}");
        }

        // LIKE doesn't copy foreign keys, so they're re-added here by reading
        // them back off the live tables. The migrations stay the one place
        // these are declared: nothing here needs updating if a migration
        // adds, drops, or changes one.
        foreach (self::TABLES as $table) {
            foreach (Schema::getForeignKeys($table) as $foreignKey) {
                $columns = implode(', ', $foreignKey['columns']);
                $foreignColumns = implode(', ', $foreignKey['foreign_columns']);
                DB::statement(
                    "ALTER TABLE {$table}_tmp ADD FOREIGN KEY ({$columns}) " .
                        "REFERENCES {$foreignKey['foreign_table']}_tmp ({$foreignColumns}) " .
                        "ON UPDATE {$foreignKey['on_update']} ON DELETE {$foreignKey['on_delete']}"
                );
            }
        }
    }

    /**
     * Bandaid reports terms for every campus. Only the Twin Cities ones are
     * stored. Careers are all kept, because their dates genuinely differ: in
     * fall 2026 undergraduate runs 2026-09-08 to 2026-12-23 while medicine runs
     * 2026-08-24 to 2026-12-18. Undergraduate and graduate always agree.
     */
    private function importTerms(): void {
        $terms = collect($this->bandaid->getTerms())
            ->filter(fn($term) => $term->INSTITUTION === self::INSTITUTION)
            ->map(fn($term) => [
                'term_code' => $term->TERM,
                'institution' => $term->INSTITUTION,
                'academic_career' => $term->ACADEMIC_CAREER,
                'description' => $term->TERM_DESCRIPTION,
                'begins_on' => $term->TERM_BEGIN_DT,
                'ends_on' => $term->TERM_END_DT,
                'created_at' => now(),
                'updated_at' => now(),
            ])
            ->values();

        $this->insertInChunks('sis_terms_tmp', $terms);
        $this->info("Terms: {$terms->count()}");
    }

    /** @param Collection<int, string> $deptIds */
    private function importDepartments($deptIds): void {
        $departments = collect($this->bandaid->getDepartments($deptIds->all()))->map(fn($dept) => [
            'dept_id' => $dept->DEPT_ID,
            'description' => $dept->DESCRIPTION,
            'college' => $dept->COLLEGE ?? null,
            'college_description' => $dept->COLLEGE_DESCRIPTION ?? null,
            'zdept_id' => $dept->ZDEPT_ID ?? null,
            'campus' => $dept->CAMPUS ?? null,
            'campus_description' => $dept->CAMPUS_DESCRIPTION ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ])->values();

        $this->insertInChunks('sis_departments_tmp', $departments);
        $this->info("Departments: {$departments->count()}");
    }

    /**
     * Fetches and writes one department at a time, so memory holds at most one
     * department's classes. An empty answer for a department is stored as
     * empty: Bandaid is the source of truth, and about half of CLA's dept ids
     * genuinely own no classes.
     *
     * @param Collection<string, string> $departments dept_id => group names
     * @return Collection<int, string> every emplid seen in rosters and appointments
     */
    private function importClassesAndAppointments(Collection $departments): Collection {
        $emplids = collect();

        foreach ($departments as $deptId => $groupNames) {
            $jobs = $this->bandaid->getEmployeesForDepartment((int) $deptId);
            $classRecords = collect($this->bandaid->getDeptClassList((int) $deptId))
                ->filter(fn($record) => $record->INSTITUTION === self::INSTITUTION);

            $sections = $this->transformer->transform($classRecords);
            $this->importSections((string) $deptId, $sections);

            $courses = $this->importCourses($classRecords);

            $appointments = $this->toAppointmentRows((string) $deptId, $jobs);
            $this->insertInChunks('sis_appointments_tmp', $appointments);

            $rosterEmplids = $sections->flatMap(
                fn(array $record) => array_column($record['instructors'], 'emplid')
            );
            $emplids = $emplids->concat($rosterEmplids)->concat($appointments->pluck('emplid'));

            $meetings = $sections->sum(fn(array $s) => count($s['meetings']));
            $this->line("  {$deptId} ({$groupNames}): {$courses} courses, {$sections->count()} sections, {$meetings} meetings, {$appointments->count()} appointments");
        }

        return $emplids->unique()->values();
    }

    /** @param Collection<int, array> $sections one department's class records */
    private function importSections(string $deptId, Collection $sections): void {
        $now = now();
        $stamp = fn(array $row) => [...$row, 'created_at' => $now, 'updated_at' => $now];

        $this->insertInChunks(
            'sis_class_sections_tmp',
            $sections->map(fn(array $record) => $stamp($record['section']))
        );

        // a bulk insert returns no ids, so read them back by the natural key
        $sectionIds = DB::table('sis_class_sections_tmp')
            ->where('academic_org', (int) $deptId)
            ->get(['id', 'term_code', 'class_number'])
            ->mapWithKeys(fn($s) => [$this->sectionKey($s->term_code, $s->class_number) => $s->id]);

        $instructors = collect();
        $meetings = collect();
        foreach ($sections as $record) {
            $section = $record['section'];
            $sectionId = $sectionIds[$this->sectionKey($section['term_code'], $section['class_number'])];

            foreach ($record['instructors'] as $instructor) {
                $instructors->push($stamp([...$instructor, 'sis_class_section_id' => $sectionId]));
            }

            foreach ($record['meetings'] as $meeting) {
                $meetings->push($stamp([...$meeting, 'sis_class_section_id' => $sectionId]));
            }
        }

        $this->insertInChunks('sis_class_instructors_tmp', $instructors);
        $this->insertInChunks('sis_class_meetings_tmp', $meetings);
    }

    private function sectionKey(int|string $termCode, int|string $classNumber): string {
        return "{$termCode}-{$classNumber}";
    }

    /**
     * Bandaid has no course endpoint, so courses are derived from the class
     * list this department has already fetched. Course facts drift across
     * terms, mostly retitling: the most recent offering wins and every value
     * it displaced is printed, because a rename nobody noticed is how a
     * department loses track of its own catalogue.
     *
     * @param Collection<int, object> $classRecords one department's, from Bandaid
     * @return int courses written
     */
    private function importCourses(Collection $classRecords): int {
        ['courses' => $courses, 'conflicts' => $conflicts] = $this->courseDeriver->derive($classRecords);

        $now = now();
        $this->insertInChunks(
            'sis_courses_tmp',
            $courses->map(fn(array $course) => [...$course, 'created_at' => $now, 'updated_at' => $now])
        );

        foreach ($conflicts as $conflict) {
            $this->warn(
                "    {$conflict['course_code']} {$conflict['field']}: kept \"{$conflict['kept']}\" " .
                    "from {$conflict['kept_term_code']}, overrode \"{$conflict['overridden']}\" " .
                    "from {$conflict['overridden_term_code']}"
            );
        }

        return $courses->count();
    }

    private function toAppointmentRows(string $deptId, array $jobs): Collection {
        return collect($jobs)
            ->filter(fn($job) => $job->EMPLID)
            ->map(fn($job) => [
                'emplid' => $job->EMPLID,
                'dept_id' => $deptId,
                'dept_name' => $job->DEPTNAME ?? null,
                'job_code' => $job->JOBCODE ?? '',
                'position_desc' => $job->POSITION_DESCR ?? null,
                'category' => $job->CATEGORY ?? null,
                'job_indicator' => $job->JOB_INDICATOR ?? null,
                'created_at' => now(),
                'updated_at' => now(),
            ])
            // the feed repeats a person once per job, and sometimes repeats a
            // job with its detail fields blank. The unique key would reject those.
            ->unique(fn(array $r) => implode('-', [$r['emplid'], $r['dept_id'], $r['job_code'], $r['job_indicator']]))
            ->values();
    }

    /**
     * Resolving names from the union of appointment and roster emplids picks
     * up someone teaching for a department they hold no appointment in.
     *
     * @param Collection<int, string> $emplids
     */
    private function importEmployees(Collection $emplids): void {
        $written = 0;
        foreach ($emplids->chunk(self::NAMES_CHUNK_SIZE) as $chunk) {
            $rows = collect($this->bandaid->getNames($chunk->values()->all()))
                ->map(fn($name) => [
                    'emplid' => $name->EMPLID,
                    'full_name' => $name->FULL_NAME ?? $name->NAME ?? null,
                    'first_name' => $name->FIRST_NAME ?? null,
                    'last_name' => $name->LAST_NAME ?? null,
                    'internet_id' => $name->INTERNET_ID ?? null,
                    'umndid' => $name->UMNDID ?? null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
                ->unique('emplid')
                ->values();

            $this->insertInChunks('sis_employees_tmp', $rows);
            $written += $rows->count();
        }

        $this->info("Employees: {$written} of {$emplids->count()} emplids resolved");
    }

    /**
     * One RENAME TABLE statement swaps every table at once, so readers never
     * see a half-replaced mirror. The displaced live tables are dropped after.
     */
    private function swapInTmpTables(): void {
        $renames = collect(self::TABLES)
            ->map(fn(string $table) => "{$table} TO {$table}_old, {$table}_tmp TO {$table}")
            ->implode(', ');

        DB::statement("RENAME TABLE {$renames}");

        // every table renames in the one statement above, parent and child
        // together, so the foreign keys already point at the fresh data by
        // the time they're dropped here. Checks are only off because the
        // displaced _old tables still reference each other
        Schema::withoutForeignKeyConstraints(function () {
            foreach (self::TABLES as $table) {
                Schema::dropIfExists("{$table}_old");
            }
        });
    }

    private function insertInChunks(string $table, Collection $rows): void {
        $rows->chunk(500)->each(fn(Collection $chunk) => DB::table($table)->insert($chunk->all()));
    }
}
