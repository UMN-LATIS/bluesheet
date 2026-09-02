<template>
  <!--
    Docked beside the grid as a column of its own, not floated over it, so
    the grid gives up width and scrolls sideways rather than losing its last
    days under the sheet. The page sizes this element; the header and the
    footer hold still while the form between them scrolls.
  -->
  <aside
    aria-label="Section details"
    class="tw-flex tw-min-h-0 tw-flex-col tw-bg-white"
  >
    <div
      class="tw-flex-none tw-border-0 tw-border-b tw-border-solid tw-border-neutral-200 tw-px-4 tw-pb-2 tw-pt-3"
    >
      <!--
        Opened from a list (an hour of the heatmap), the sheet is one level
        down, so its way out is back up to that list rather than closing.
      -->
      <button
        v-if="returnTo"
        type="button"
        class="tw-mb-2 tw-flex tw-cursor-pointer tw-items-center tw-gap-1 tw-border-none tw-bg-transparent tw-p-0 tw-text-xs tw-font-semibold tw-text-bs-blue hover:tw-underline"
        @click="emit('back')"
      >
        <i class="fas fa-chevron-left tw-text-[0.6rem]" aria-hidden="true" />
        {{ returnTo }}
      </button>

      <div class="tw-flex tw-items-start tw-justify-between tw-gap-2">
        <p
          class="tw-m-0 tw-truncate tw-text-xs tw-text-neutral-500"
          :title="section.title"
        >
          {{ section.title }}
        </p>
        <button
          v-if="!returnTo"
          type="button"
          aria-label="Close"
          class="tw-flex-none tw-cursor-pointer tw-border-none tw-bg-transparent tw-text-xl tw-leading-none tw-text-neutral-500 hover:tw-text-neutral-800"
          @click="emit('close')"
        >
          ×
        </button>
      </div>

      <h2 class="tw-m-0 tw-font-mono tw-text-base tw-font-bold">
        {{ draft.subject }} {{ draft.catalogNumber }} · {{ draft.section }}
        <!-- How many other numbers this same class is listed under. -->
        <span v-if="partners.length > 0" class="tw-text-neutral-400">
          [+{{ partners.length }}]
        </span>
      </h2>
    </div>

    <div
      class="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-gap-4 tw-overflow-y-auto tw-p-4 tw-text-sm"
    >
      <div>
        <label :for="fieldId('section')" :class="LABEL_CLASS">
          Section number
        </label>
        <input
          :id="fieldId('section')"
          :value="draft.section"
          type="text"
          :class="[INPUT_CLASS, 'tw-w-24 tw-font-mono']"
          @input="edit({ section: valueOf($event) })"
        />
      </div>

      <div>
        <span :class="LABEL_CLASS">Component</span>
        <SegmentedControl
          label="Component"
          :options="componentOptions"
          :chosen="[draft.component]"
          @choose="(code) => edit({ component: code })"
        />
      </div>

      <div>
        <span :class="LABEL_CLASS">Delivery</span>
        <SegmentedControl
          label="Delivery"
          :options="DELIVERY_OPTIONS"
          :chosen="[draft.delivery]"
          @choose="(how) => edit({ delivery: how as Delivery })"
        />
      </div>

      <!--
        One group per meeting pattern. Almost every section has exactly one,
        so the common case reads as a plain Days and Time pair; a section that
        meets at different hours on different days gets a group each, and a
        drag on the grid can split one pattern into two.
      -->
      <div
        v-for="(pattern, patternIndex) in patterns"
        :key="patternIndex"
        class="tw-flex tw-flex-col tw-gap-4"
      >
        <div>
          <div class="tw-flex tw-items-baseline tw-justify-between">
            <span :class="LABEL_CLASS">
              Days<template v-if="patterns.length > 1">
                · {{ patternIndex + 1 }}</template
              >
            </span>
            <button
              v-if="patterns.length > 1"
              type="button"
              class="tw-cursor-pointer tw-border-none tw-bg-transparent tw-p-0 tw-text-xs tw-text-neutral-500 hover:tw-text-neutral-800"
              :aria-label="`Remove meeting time ${patternIndex + 1}`"
              @click="schedule.removeMeetingPattern(section.id, patternIndex)"
            >
              ×
            </button>
          </div>
          <SegmentedControl
            label="Days"
            :options="DAY_OPTIONS"
            :chosen="pattern?.days ?? [ASYNC]"
            @choose="(day) => pressDay(patternIndex, day)"
          />
        </div>

        <!-- No pattern is the Async state, which has no time to show. -->
        <div v-if="pattern">
          <span :class="LABEL_CLASS">Time</span>
          <div class="tw-flex tw-items-center tw-gap-2">
            <input
              :value="pattern.startTime"
              type="time"
              :aria-label="`Start time ${patternIndex + 1}`"
              :class="INPUT_CLASS"
              @input="
                schedule.editMeetingTime(section.id, patternIndex, {
                  startTime: valueOf($event),
                })
              "
            />
            <span class="tw-text-xs tw-text-neutral-500">to</span>
            <input
              :value="pattern.endTime"
              type="time"
              :aria-label="`End time ${patternIndex + 1}`"
              :class="INPUT_CLASS"
              @input="
                schedule.editMeetingTime(section.id, patternIndex, {
                  endTime: valueOf($event),
                })
              "
            />
          </div>
          <p
            v-if="problemWith(patternIndex)"
            class="tw-m-0 tw-mt-1 tw-text-xs tw-text-red-700"
          >
            {{ problemWith(patternIndex) }}
          </p>
          <p v-else class="tw-m-0 tw-mt-1 tw-text-xs tw-text-neutral-500">
            {{ durationOf(pattern) }} minutes
          </p>
        </div>
      </div>

      <button
        v-if="patterns.length > 0"
        type="button"
        class="tw--mt-2 tw-self-start tw-cursor-pointer tw-border-none tw-bg-transparent tw-p-0 tw-text-xs tw-font-semibold tw-text-bs-blue hover:tw-underline"
        @click="schedule.addMeetingPattern(section.id)"
      >
        Add meeting time
      </button>

      <div>
        <span :class="LABEL_CLASS">Instructors</span>
        <div
          v-for="instructor in draft.instructors"
          :key="instructor.emplid"
          class="tw-mb-1 tw-flex tw-items-center tw-justify-between tw-gap-2 tw-rounded tw-border tw-border-solid tw-border-neutral-200 tw-px-2.5 tw-py-1.5"
        >
          <span>
            {{ instructor.name ?? "TBA" }}
            <!-- The usual role is unremarkable; a TA or a second instructor is not. -->
            <span
              v-if="instructor.role !== PRIMARY_ROLE"
              class="tw-text-xs tw-text-neutral-500"
            >
              {{ instructor.role }}
            </span>
          </span>
          <button
            type="button"
            class="tw-cursor-pointer tw-border-none tw-bg-transparent tw-p-0 tw-text-neutral-500 hover:tw-text-neutral-800"
            :aria-label="`Remove ${instructor.name ?? 'instructor'}`"
            @click="removeInstructor(instructor.emplid)"
          >
            ×
          </button>
        </div>
        <p
          v-if="draft.instructors.length === 0"
          class="tw-m-0 tw-mb-1 tw-text-neutral-500"
        >
          TBA
        </p>
        <ComboBox
          label="Add instructor"
          placeholder="Add instructor…"
          :showLabel="false"
          :options="rosterOptions"
          :modelValue="null"
          strategy="fixed"
          teleportTo="body"
          @update:modelValue="addInstructor"
        />
      </div>

      <div>
        <label :for="fieldId('cap')" :class="LABEL_CLASS">
          Enrollment cap
        </label>
        <div class="tw-flex tw-items-baseline tw-gap-3">
          <input
            :id="fieldId('cap')"
            :value="capText"
            type="number"
            min="0"
            :class="[INPUT_CLASS, 'tw-w-24']"
            @input="editCap(valueOf($event))"
          />
          <span class="tw-text-xs tw-text-neutral-500">
            {{ section.enrollmentTotal }} enrolled
            <!--
              Only when every partner's cap is known. Most cross-lists reach
              into departments the import does not hold, and a sum missing one
              of them would read as a real, smaller number.
            -->
            <template v-if="combinedCap !== null">
              · combined cap {{ combinedCap }}
            </template>
          </span>
        </div>
      </div>

      <div>
        <label :for="fieldId('notes')" :class="LABEL_CLASS">Notes</label>
        <textarea
          :id="fieldId('notes')"
          :value="draft.notes"
          rows="3"
          placeholder="Internal to the department"
          :class="[INPUT_CLASS, 'tw-w-full']"
          @input="edit({ notes: valueOf($event) })"
        />
      </div>

      <div v-if="partners.length > 0">
        <span :class="LABEL_CLASS">Cross-listed as</span>
        <div
          v-for="partner in partners"
          :key="`${partner.subject}${partner.catalogNumber}`"
          class="tw-mb-1 tw-flex tw-items-baseline tw-justify-between tw-gap-2 tw-rounded tw-border tw-border-solid tw-border-neutral-200 tw-px-2.5 tw-py-1.5"
        >
          <span class="tw-font-mono">
            {{ partner.subject }} {{ partner.catalogNumber }}
          </span>
          <span class="tw-text-xs tw-text-neutral-500">
            {{
              partner.subject === section.subject
                ? "same subject"
                : "other subject"
            }}
          </span>
        </div>
      </div>
    </div>

    <div
      class="tw-flex-none tw-border-0 tw-border-t tw-border-solid tw-border-neutral-200 tw-px-4 tw-py-3"
    >
      <!--
        Whatever holds Save back that is not about one meeting time, said
        where the button is rather than beside the field, since the button is
        where the user is looking when nothing happens.
      -->
      <p
        v-for="problem in generalProblems"
        :key="problem.message"
        class="tw-m-0 tw-mb-2 tw-text-xs tw-text-red-700"
      >
        {{ problem.message }}
      </p>

      <div class="tw-flex tw-items-center tw-gap-3">
        <button
          type="button"
          class="tw-rounded tw-border tw-border-solid tw-border-bs-blue tw-bg-bs-blue tw-px-3 tw-py-1 tw-text-xs tw-font-semibold tw-text-white disabled:tw-cursor-default disabled:tw-border-neutral-200 disabled:tw-bg-neutral-100 disabled:tw-text-neutral-400"
          :class="{ 'tw-cursor-pointer': isDirty && problems.length === 0 }"
          :disabled="!isDirty || problems.length > 0"
          @click="schedule.saveDraft(section.id)"
        >
          Save
        </button>
        <button
          v-if="isDirty"
          type="button"
          class="tw-cursor-pointer tw-border-none tw-bg-transparent tw-p-0 tw-text-xs tw-font-semibold tw-text-neutral-600 hover:tw-underline"
          @click="schedule.cancelDraft(section.id)"
        >
          Cancel
        </button>
        <span class="tw-ml-auto tw-text-xs tw-text-neutral-500">
          {{ section.credits ?? "—" }} credits · class {{ section.classNumber }}
        </span>
      </div>

      <button
        v-if="schedule.hasEdits(section.id)"
        type="button"
        class="tw-mt-2 tw-cursor-pointer tw-border-none tw-bg-transparent tw-p-0 tw-text-xs tw-font-semibold tw-text-umn-maroon hover:tw-underline"
        @click="schedule.revertSection(section.id)"
      >
        Revert to SIS
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from "vue";
import SegmentedControl, { type SegmentedOption } from "./SegmentedControl.vue";
import { ComboBox, type ComboBoxOptionType } from "@/components/ComboBox";
import { minutesFromClock } from "../helpers/timeScale";
import type {
  Delivery,
  PlannedSection,
  SisDay,
  SisEmployee,
  SisSectionMeeting,
} from "../types";
import type { ScheduleEditor } from "../useScheduleEditor";

const props = defineProps<{
  section: PlannedSection;
  schedule: ScheduleEditor;
  /** The term's sections, for reading a cross-list partner's cap. */
  sections: PlannedSection[];
  /** The department roster, which is who a section can be assigned to. */
  roster: SisEmployee[];
  /** Names the list this sheet was opened from, e.g. "Tue · 2 – 3p", if any. */
  returnTo?: string | null;
}>();

const emit = defineEmits<{ close: []; back: [] }>();

/** Shared by every row's label, styled like a form field's. */
const LABEL_CLASS =
  "tw-m-0 tw-mb-1 tw-block tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-neutral-500";

const INPUT_CLASS =
  "tw-rounded tw-border tw-border-solid tw-border-neutral-300 tw-px-2 tw-py-1.5 tw-text-sm";

/** The codes the imported SIS data uses; anything else joins them on sight. */
const COMPONENT_CODES = ["LEC", "DIS", "LAB", "FWK", "IND"];

const DELIVERY_OPTIONS: SegmentedOption[] = [
  { value: "onCampus", label: "On campus" },
  { value: "blended", label: "Blended" },
  { value: "online", label: "Online" },
];

/**
 * What the SIS calls the instructor of record. Someone added here takes it,
 * and it is the role the sheet leaves unsaid.
 */
const PRIMARY_ROLE = "PI";

/** The value of the Days button that stands for no meeting time at all. */
const ASYNC = "async";

const DAY_OPTIONS: SegmentedOption[] = [
  { value: "mon", label: "M" },
  { value: "tue", label: "T" },
  { value: "wed", label: "W" },
  { value: "thu", label: "Th" },
  { value: "fri", label: "F" },
  { value: ASYNC, label: "Async" },
];

/** Unique per section, so two sheets in one page cannot share a label. */
const fieldId = (field: string) => `section-${props.section.id}-${field}`;

/** What the form holds: the section with any unsaved keystrokes over it. */
const draft = computed(() => props.schedule.draftSection(props.section));

const isDirty = computed(() => props.schedule.isDraftDirty(props.section));

const edit = (change: Parameters<ScheduleEditor["editSection"]>[1]) =>
  props.schedule.editSection(props.section.id, change);

const valueOf = (event: Event) =>
  (event.target as HTMLInputElement | HTMLTextAreaElement).value;

/** A code the import has never sent still shows, rather than reading as LEC. */
const componentOptions = computed<SegmentedOption[]>(() =>
  (COMPONENT_CODES.includes(draft.value.component)
    ? COMPONENT_CODES
    : [...COMPONENT_CODES, draft.value.component]
  ).map((code) => ({ value: code, label: code })),
);

/**
 * One group per pattern, and one empty group when there are none, so a
 * section with no set time still shows the days to press to give it one.
 */
const patterns = computed(() =>
  draft.value.meetings.length === 0 ? [undefined] : draft.value.meetings,
);

/** Async is a day like the others here: the one that means none of them. */
const pressDay = (patternIndex: number, day: string) =>
  day === ASYNC
    ? props.schedule.makeAsynchronous(props.section.id)
    : props.schedule.toggleMeetingDay(
        props.section.id,
        patternIndex,
        day as SisDay,
      );

const durationOf = (pattern: SisSectionMeeting) =>
  minutesFromClock(pattern.endTime) - minutesFromClock(pattern.startTime);

const problems = computed(() => props.schedule.draftProblems(props.section));

const generalProblems = computed(() =>
  problems.value.filter(({ patternIndex }) => patternIndex === undefined),
);

/**
 * An emptied cap is held as NaN rather than snapped to zero, so the field
 * stays empty while it is being retyped and Save waits for a real number.
 */
const capText = computed(() =>
  Number.isNaN(draft.value.enrollmentCap) ? "" : draft.value.enrollmentCap,
);

const editCap = (raw: string) =>
  edit({ enrollmentCap: raw.trim() === "" ? NaN : Number(raw) });

const problemWith = (patternIndex: number) =>
  problems.value.find((problem) => problem.patternIndex === patternIndex)
    ?.message;

/** Anyone already on the section is not offered again. */
const rosterOptions = computed<ComboBoxOptionType[]>(() =>
  props.roster
    .filter(
      (person) =>
        !draft.value.instructors.some(
          (instructor) => instructor.emplid === person.emplid,
        ),
    )
    .map((person) => ({
      id: person.emplid,
      label: person.name ?? String(person.emplid),
      secondaryLabel: person.positionTitle ?? undefined,
    })),
);

function addInstructor(option: ComboBoxOptionType | null) {
  const person = props.roster.find(({ emplid }) => emplid === option?.id);
  if (!person) return;

  edit({
    instructors: [
      ...draft.value.instructors,
      {
        emplid: person.emplid,
        role: PRIMARY_ROLE,
        name: person.name,
        lastName: person.lastName,
        internetId: person.internetId,
      },
    ],
  });
}

const removeInstructor = (emplid: number) =>
  edit({
    instructors: draft.value.instructors.filter(
      (instructor) => instructor.emplid !== emplid,
    ),
  });

const partners = computed(() => props.section.crosslist?.partners ?? []);

/**
 * What the shared classroom holds in total, when every partner is a section
 * this page knows about. A partner in another department is not in the
 * payload, so its cap cannot be read and no total is offered.
 */
const combinedCap = computed(() => {
  if (partners.value.length === 0) return null;

  const found = partners.value.map((partner) =>
    props.sections.find(
      (section) =>
        section.subject === partner.subject &&
        section.catalogNumber === partner.catalogNumber &&
        section.section === partner.section,
    ),
  );

  if (found.some((section) => section === undefined)) return null;

  return found.reduce(
    (total, section) => total + (section?.enrollmentCap ?? 0),
    draft.value.enrollmentCap,
  );
});
</script>
