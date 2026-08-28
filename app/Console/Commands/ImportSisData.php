<?php

namespace App\Console\Commands;

use App\Group;
use App\Library\Bandaid;
use App\Library\Sis\ClassRecordTransformer;
use App\SisAppointment;
use App\SisClassSection;
use App\SisDepartment;
use App\SisEmployee;
use App\SisTerm;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ImportSisData extends Command {
    protected $signature = 'import:sis {--dept= : limit to a single dept_id, for testing}';

    protected $description = 'Mirror Bandaid terms, departments, people and classes into the sis_ tables';

    /**
     * Bandaid's names endpoint takes a batch of emplids. A few thousand people
     * across CLA split into a handful of requests at this size.
     */
    private const NAMES_CHUNK = 500;

    /** Bluesheet covers the Twin Cities campus; other campuses are not stored. */
    private const INSTITUTION = 'UMNTC';

    private Bandaid $bandaid;
    private ClassRecordTransformer $transformer;

    /** Every emplid seen, from appointments and from class rosters alike. */
    private array $emplids = [];

    public function handle(): int {
        $this->bandaid = new Bandaid();
        $this->transformer = new ClassRecordTransformer();

        $departments = $this->departments();

        if ($departments->isEmpty()) {
            $this->error('No groups have a numeric dept_id. Nothing to import.');
            return Command::FAILURE;
        }

        $this->importTerms();
        $this->importDepartments($departments->keys());

        $outcomes = ['imported' => 0, 'empty' => 0, 'failed' => 0];
        foreach ($departments as $deptId => $groupNames) {
            $outcomes[$this->importDepartment((string) $deptId, $groupNames)]++;
        }

        $this->importEmployees();

        if ($outcomes['empty'] > 0) {
            $this->warn("{$outcomes['empty']} department(s) returned no classes and kept their previous data.");
        }

        if ($outcomes['failed'] > 0) {
            $this->warn("{$outcomes['failed']} department(s) failed and kept their previous data.");
        }

        $this->info("Done. {$outcomes['imported']} of {$departments->count()} departments imported.");

        return $outcomes['imported'] === 0 ? Command::FAILURE : Command::SUCCESS;
    }

    /**
     * Department ids to import, with the groups that supplied them.
     *
     * dept_id is a free text column, so it holds typos and placeholder text
     * alongside real ids. Anything non-numeric is reported by group rather than
     * dropped in silence, because a typo there means that department never
     * imports and nothing else would say so.
     *
     * @return \Illuminate\Support\Collection<string, string> dept_id => group names
     */
    private function departments() {
        if ($single = $this->option('dept')) {
            return collect([$single => "--dept={$single}"]);
        }

        $groups = Group::whereNotNull('dept_id')->get(['id', 'group_title', 'dept_id']);

        [$usable, $unusable] = $groups->partition(
            fn(Group $group) => is_numeric(trim((string) $group->dept_id))
        );

        foreach ($unusable as $group) {
            $this->warn("  skipping group {$group->id} \"{$group->group_title}\": dept_id \"{$group->dept_id}\" is not a number");
        }

        return $usable
            ->groupBy(fn(Group $group) => trim((string) $group->dept_id))
            ->map(fn($groups) => $groups->pluck('group_title')->implode(', '));
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

        DB::transaction(function () use ($terms) {
            SisTerm::query()->delete();
            $terms->chunk(500)->each(fn($chunk) => SisTerm::insert($chunk->all()));
        });

        $this->info("Terms: {$terms->count()}");
    }

    /** @param \Illuminate\Support\Collection<int, string> $deptIds */
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
        ]);

        DB::transaction(function () use ($departments) {
            SisDepartment::query()->delete();
            $departments->chunk(500)->each(fn($chunk) => SisDepartment::insert($chunk->all()));
        });

        $this->info("Departments: {$departments->count()}");
    }

    /**
     * Refreshes one department, returning 'imported', 'empty' or 'failed'.
     *
     * Fetches outside the transaction so a Bandaid timeout never holds one
     * open, then replaces the department's rows inside one.
     *
     * An unknown department id is not an error at Bandaid: it answers 200 with
     * an empty array, exactly as it would for a real department with nothing on
     * the books. Since the mirror covers every term Bandaid holds, an empty
     * result for a department that already has rows means the id is wrong or
     * Bandaid is having a bad day, never that the department stopped teaching.
     * Replacing on that answer would delete a real schedule, so it is skipped.
     */
    private function importDepartment(string $deptId, string $groupNames): string {
        try {
            $jobs = $this->bandaid->getEmployeesForDepartment((int) $deptId);
            $classRecords = $this->bandaid->getDeptClassList((int) $deptId);
        } catch (\Throwable $e) {
            Log::error("import:sis could not fetch department {$deptId}: {$e->getMessage()}");
            $this->error("  {$deptId}: fetch failed, previous data kept");
            return 'failed';
        }

        $classRecords = array_values(array_filter(
            $classRecords,
            fn($record) => $record->INSTITUTION === self::INSTITUTION
        ));

        if (empty($classRecords) && empty($jobs)) {
            $existing = SisClassSection::where('academic_org', (int) $deptId)->count();
            $this->warn("  {$deptId} ({$groupNames}): Bandaid returned nothing"
                . ($existing > 0 ? ", keeping {$existing} existing sections" : ', and none is stored'));
            return 'empty';
        }

        $sections = $this->transformer->transform($classRecords);

        try {
            DB::transaction(function () use ($deptId, $jobs, $sections) {
                $this->replaceAppointments($deptId, $jobs);
                $this->replaceSections($deptId, $sections);
            });
        } catch (\Throwable $e) {
            Log::error("import:sis could not write department {$deptId}: {$e->getMessage()}");
            $this->error("  {$deptId}: write failed, previous data kept");
            return 'failed';
        }

        $meetings = $sections->sum(fn(array $s) => count($s['meetings']));
        $this->line("  {$deptId}: {$sections->count()} sections, {$meetings} meetings, " . count($jobs) . ' appointments');

        return 'imported';
    }

    private function replaceAppointments(string $deptId, array $jobs): void {
        SisAppointment::where('dept_id', $deptId)->delete();

        $rows = collect($jobs)
            ->filter(fn($job) => $job->EMPLID)
            ->map(function ($job) use ($deptId) {
                $this->emplids[$job->EMPLID] = true;

                return [
                    'emplid' => $job->EMPLID,
                    'dept_id' => $deptId,
                    'dept_name' => $job->DEPTNAME ?? null,
                    'job_code' => $job->JOBCODE ?? '',
                    'position_desc' => $job->POSITION_DESCR ?? null,
                    'category' => $job->CATEGORY ?? null,
                    'job_indicator' => $job->JOB_INDICATOR ?? null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            })
            // the feed repeats a person once per job, and occasionally repeats a
            // job with its detail fields blank; the unique key would reject those
            ->unique(fn(array $r) => implode('-', [$r['emplid'], $r['dept_id'], $r['job_code'], $r['job_indicator']]))
            ->values();

        $rows->chunk(500)->each(fn($chunk) => SisAppointment::insert($chunk->all()));
    }

    /** @param \Illuminate\Support\Collection<int, array> $sections */
    private function replaceSections(string $deptId, $sections): void {
        // cascade takes instructors and meetings with them
        SisClassSection::where('academic_org', (int) $deptId)->delete();

        foreach ($sections as $record) {
            $section = SisClassSection::create($record['section']);

            foreach ($record['instructors'] as $instructor) {
                $this->emplids[$instructor['emplid']] = true;
            }

            $section->instructors()->createMany($record['instructors']);
            $section->meetings()->createMany($record['meetings']);
        }
    }

    /**
     * Runs last, because the emplid set is only complete once appointments and
     * class rosters have both been read. Resolving from that union is what picks
     * up someone teaching for a department they hold no appointment in.
     */
    private function importEmployees(): void {
        $emplids = array_keys($this->emplids);

        if (empty($emplids)) {
            $this->warn('No emplids seen, skipping employee lookup.');
            return;
        }

        $written = 0;
        foreach (array_chunk($emplids, self::NAMES_CHUNK) as $chunk) {
            try {
                $names = $this->bandaid->getNames($chunk);
            } catch (\Throwable $e) {
                Log::error("import:sis could not resolve names: {$e->getMessage()}");
                $this->error('  names lookup failed for one chunk, previous rows kept');
                continue;
            }

            $rows = collect($names)->map(fn($name) => [
                'emplid' => $name->EMPLID,
                'full_name' => $name->FULL_NAME ?? $name->NAME ?? null,
                'first_name' => $name->FIRST_NAME ?? null,
                'last_name' => $name->LAST_NAME ?? null,
                'internet_id' => $name->INTERNET_ID ?? null,
                'umndid' => $name->UMNDID ?? null,
                'updated_at' => now(),
                'created_at' => now(),
            ])->unique('emplid')->values();

            SisEmployee::upsert(
                $rows->all(),
                ['emplid'],
                ['full_name', 'first_name', 'last_name', 'internet_id', 'umndid', 'updated_at']
            );
            $written += $rows->count();
        }

        $this->info("Employees: {$written} of " . count($emplids) . ' emplids resolved');
    }
}
