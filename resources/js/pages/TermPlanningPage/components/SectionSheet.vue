<template>
  <aside
    aria-label="Section details"
    class="tw-flex tw-h-full tw-w-full tw-flex-col tw-min-h-0 tw-bg-surface-bright tw-text-on-surface"
  >
    <!-- Marks the sheet as a panel dragged up over a phone screen. -->
    <div v-if="hasHandle" class="tw-flex-none tw-pt-2">
      <div
        class="tw-mx-auto tw-h-1 tw-w-10 tw-rounded-full tw-bg-outline-variant"
      />
    </div>

    <div
      class="tw-flex-none tw-border-0 tw-border-b tw-border-solid tw-border-surface-container tw-px-[18px] tw-pb-3 tw-pt-3.5"
      :class="{ 'tw-bg-brand/[0.06]': draft.isCancelled }"
    >
      <button
        v-if="returnTo"
        type="button"
        class="tw-mb-2 tw-flex tw-cursor-pointer tw-items-center tw-gap-1 tw-border-none tw-bg-transparent tw-p-0 tw-text-xs tw-font-semibold tw-text-primary hover:tw-underline"
        @click="emit('back')"
      >
        <i class="fas fa-chevron-left tw-text-[0.6rem]" aria-hidden="true" />
        {{ returnTo }}
      </button>

      <div class="tw-flex tw-items-center tw-gap-2">
        <span
          class="tw-inline-flex tw-h-5 tw-items-center tw-rounded-full tw-border tw-border-solid tw-px-2.5 tw-text-[10px] tw-font-bold tw-tracking-[0.07em] tw-text-on-surface"
          :class="colorOfType(draft.component).badge"
        >
          {{ draft.component }}
        </span>
        <span
          v-if="draft.isCancelled"
          class="tw-inline-flex tw-h-5 tw-items-center tw-rounded-full tw-bg-brand tw-px-2 tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-wide tw-text-white"
        >
          Cancelled
        </span>
        <span class="tw-text-[11.5px] tw-text-on-surface-variant">
          {{ labelOfDelivery(draft.delivery) }}
        </span>
        <button
          v-if="!returnTo"
          type="button"
          aria-label="Close"
          class="tw-ml-auto tw-flex tw-h-11 tw-w-11 tw-flex-none tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-full tw-border-none tw-bg-transparent tw-text-xl tw-leading-none tw-text-on-surface-variant hover:tw-bg-surface-container hover:tw-text-on-surface"
          @click="emit('close')"
        >
          ×
        </button>
      </div>

      <h2 class="tw-m-0 tw-mt-1 tw-text-[19px] tw-font-bold tw-tracking-tight">
        {{ draft.subject }} {{ draft.catalogNumber }} · {{ draft.section }}
        <!-- How many other numbers this same class is listed under. -->
        <span v-if="partners.length > 0" class="tw-text-on-surface-variant">
          [+{{ partners.length }}]
        </span>
      </h2>

      <p
        class="tw-m-0 tw-truncate tw-text-[12.5px] tw-text-on-surface-variant"
        :title="section.title"
      >
        {{ section.title }}
      </p>

      <p class="tw-m-0 tw-mt-2 tw-text-[11.5px] tw-text-on-surface-variant">
        {{ metaLine }}
      </p>
    </div>

    <SectionFacts v-if="isReadOnly" :section="section" />

    <div
      v-else
      class="scrollbar-always-visible tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-gap-5 tw-overflow-y-auto tw-p-[18px]"
    >
      <div>
        <label :for="fieldId('section')" :class="LABEL_CLASS">Section</label>
        <input
          :id="fieldId('section')"
          :value="draft.section"
          type="text"
          :class="[INPUT_CLASS, 'tw-w-24']"
          @input="edit({ section: valueOf($event) })"
        />
      </div>

      <div>
        <span :class="LABEL_CLASS">Meets</span>
        <div class="tw-flex tw-flex-col tw-gap-4">
          <div
            v-for="(pattern, patternIndex) in patterns"
            :key="patternIndex"
            class="tw-flex tw-flex-col tw-gap-2"
          >
            <div
              v-if="patterns.length > 1"
              class="tw-flex tw-items-center tw-justify-between tw-gap-2"
            >
              <span
                class="tw-text-[11px] tw-font-semibold tw-text-on-surface-variant"
              >
                Meeting {{ patternIndex + 1 }}
              </span>
              <button
                type="button"
                class="tw-flex tw-h-7 tw-w-7 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-full tw-border-none tw-bg-transparent tw-text-xs tw-text-on-surface-variant hover:tw-bg-surface-container hover:tw-text-on-surface"
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

            <!-- No pattern is the Async state, which has no time to show. -->
            <template v-if="pattern">
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
                <span class="tw-text-sm tw-text-on-surface-variant">to</span>
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
                class="tw-m-0 tw-text-xs tw-text-red-700"
              >
                {{ problemWith(patternIndex) }}
              </p>
              <p v-else class="tw-m-0 tw-text-xs tw-text-on-surface-variant">
                {{ durationOf(pattern) }} minutes
              </p>
            </template>
          </div>

          <button
            v-if="patterns.length > 0"
            type="button"
            class="tw-cursor-pointer tw-self-start tw-border-none tw-bg-transparent tw-p-0 tw-text-xs tw-font-semibold tw-text-primary hover:tw-underline"
            @click="schedule.addMeetingPattern(section.id)"
          >
            Add meeting
          </button>
        </div>
      </div>

      <div class="tw-h-px tw-bg-surface-container" />

      <div>
        <span :class="LABEL_CLASS">Taught by</span>
        <div class="tw-flex tw-flex-col tw-gap-2">
          <div
            v-for="instructor in instructorsOnRecord"
            :key="instructor.emplid"
            class="tw-flex tw-items-center tw-gap-2.5 tw-rounded-[10px] tw-border tw-border-solid tw-border-outline-variant tw-p-2 tw-pl-3"
          >
            <span
              class="tw-flex tw-h-7 tw-w-7 tw-flex-none tw-items-center tw-justify-center tw-rounded-full tw-bg-surface-container tw-text-[10px] tw-font-bold tw-text-on-surface-variant"
            >
              {{ initialsOf(instructor) }}
            </span>
            <div class="tw-min-w-0 tw-flex-1">
              <p class="tw-m-0 tw-truncate tw-text-[13.5px] tw-text-on-surface">
                {{ instructor.name ?? "TBA" }}
              </p>
              <p class="tw-m-0 tw-text-[11px] tw-text-on-surface-variant">
                Instructor of record
              </p>
            </div>
            <button
              type="button"
              class="tw-flex tw-h-11 tw-w-11 tw-flex-none tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-full tw-border-none tw-bg-transparent tw-text-on-surface-variant hover:tw-bg-surface-container hover:tw-text-on-surface"
              :aria-label="`Remove ${instructor.name ?? 'instructor'}`"
              @click="removeInstructor(instructor.emplid)"
            >
              ×
            </button>
          </div>
          <p
            v-if="instructorsOnRecord.length === 0"
            class="tw-m-0 tw-text-[13px] tw-text-on-surface-variant"
          >
            TBA
          </p>
        </div>

        <button
          v-if="!isAddingInstructor"
          type="button"
          class="tw-mt-2 tw-cursor-pointer tw-border-none tw-bg-transparent tw-p-0 tw-text-[12.5px] tw-font-semibold tw-text-primary hover:tw-underline"
          @click="isAddingInstructor = true"
        >
          Add instructor
        </button>
        <ComboBox
          v-else
          label="Add instructor"
          placeholder="Add instructor…"
          :showLabel="false"
          :options="rosterOptions"
          :modelValue="null"
          strategy="fixed"
          teleportTo="body"
          class="tw-mt-2"
          @update:modelValue="(option) => addPerson(option, PRIMARY_ROLE)"
        />
      </div>

      <div class="tw-h-px tw-bg-surface-container" />

      <div>
        <label :for="fieldId('cap')" :class="LABEL_CLASS">
          Enrollment cap
        </label>
        <div class="tw-flex tw-items-center tw-gap-3">
          <input
            :id="fieldId('cap')"
            :value="capText"
            type="number"
            min="0"
            :class="[INPUT_CLASS, 'tw-w-24']"
            @input="editCap(valueOf($event))"
          />
          <span class="tw-text-[13px] tw-text-on-surface-variant">
            <span class="tw-font-semibold tw-text-on-surface">
              {{ section.enrollmentTotal }}
            </span>
            enrolled
            <template v-if="combinedCap !== null">
              · combined cap {{ combinedCap }}
            </template>
          </span>
        </div>
      </div>

      <div class="tw-h-px tw-bg-surface-container" />

      <div class="tw-flex tw-flex-col tw-gap-3.5">
        <Disclosure label="Component & delivery" :summary="componentSummary">
          <div class="tw-flex tw-gap-3">
            <div class="tw-min-w-0 tw-flex-1">
              <label
                :for="fieldId('component')"
                class="tw-mb-1.5 tw-block tw-text-[11px] tw-text-on-surface-variant"
              >
                Component
              </label>
              <select
                :id="fieldId('component')"
                :value="draft.component"
                :class="[INPUT_CLASS, 'tw-w-full']"
                @change="edit({ component: valueOf($event) })"
              >
                <option
                  v-for="code in componentCodes"
                  :key="code"
                  :value="code"
                >
                  {{ code }} — {{ labelOfComponent(code) }}
                </option>
              </select>
            </div>
            <div class="tw-min-w-0 tw-flex-1">
              <label
                :for="fieldId('delivery')"
                class="tw-mb-1.5 tw-block tw-text-[11px] tw-text-on-surface-variant"
              >
                Delivery
              </label>
              <select
                :id="fieldId('delivery')"
                :value="draft.delivery"
                :class="[INPUT_CLASS, 'tw-w-full']"
                @change="edit({ delivery: valueOf($event) as Delivery })"
              >
                <option
                  v-for="option in DELIVERY_OPTIONS"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </div>
          </div>
        </Disclosure>

        <div class="tw-h-px tw-bg-surface-container" />

        <Disclosure label="Cross-listings" :summary="crosslistSummary">
          <p
            v-if="partners.length === 0"
            class="tw-m-0 tw-text-[12.5px] tw-text-on-surface-variant"
          >
            This section is not listed under another number.
          </p>
          <div v-else class="tw-flex tw-flex-col tw-gap-1.5">
            <div
              v-for="partner in partners"
              :key="`${partner.subject}${partner.catalogNumber}${partner.section}`"
              class="tw-flex tw-items-baseline tw-justify-between tw-gap-2 tw-rounded-lg tw-bg-surface-container tw-px-3 tw-py-2 tw-text-[13px]"
            >
              <span>
                {{ partner.subject }} {{ partner.catalogNumber }} ·
                {{ partner.section }}
              </span>
              <span class="tw-text-[11px] tw-text-on-surface-variant">
                {{
                  partner.subject === section.subject
                    ? "same subject"
                    : "other subject"
                }}
              </span>
            </div>
          </div>
          <button
            type="button"
            disabled
            title="Cross-listings come from the SIS import and cannot be added here yet"
            class="tw-mt-2 tw-cursor-default tw-border-none tw-bg-transparent tw-p-0 tw-text-[12.5px] tw-font-semibold tw-text-on-surface-variant"
          >
            Add cross-listing
          </button>
        </Disclosure>

        <div class="tw-h-px tw-bg-surface-container" />

        <Disclosure
          label="Teaching assistants"
          :summary="String(assistants.length)"
        >
          <div class="tw-flex tw-flex-col tw-gap-2">
            <div
              v-for="instructor in assistants"
              :key="instructor.emplid"
              class="tw-flex tw-items-center tw-gap-2.5 tw-rounded-[10px] tw-border tw-border-solid tw-border-outline-variant tw-p-2 tw-pl-3"
            >
              <span
                class="tw-flex tw-h-7 tw-w-7 tw-flex-none tw-items-center tw-justify-center tw-rounded-full tw-bg-surface-container tw-text-[10px] tw-font-bold tw-text-on-surface-variant"
              >
                {{ initialsOf(instructor) }}
              </span>
              <div class="tw-min-w-0 tw-flex-1">
                <p
                  class="tw-m-0 tw-truncate tw-text-[13.5px] tw-text-on-surface"
                >
                  {{ instructor.name ?? "TBA" }}
                </p>
                <p class="tw-m-0 tw-text-[11px] tw-text-on-surface-variant">
                  {{ instructor.role }}
                </p>
              </div>
              <button
                type="button"
                class="tw-flex tw-h-11 tw-w-11 tw-flex-none tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-full tw-border-none tw-bg-transparent tw-text-on-surface-variant hover:tw-bg-surface-container hover:tw-text-on-surface"
                :aria-label="`Remove ${instructor.name ?? 'instructor'}`"
                @click="removeInstructor(instructor.emplid)"
              >
                ×
              </button>
            </div>
          </div>

          <button
            v-if="!isAddingAssistant"
            type="button"
            class="tw-mt-2 tw-cursor-pointer tw-border-none tw-bg-transparent tw-p-0 tw-text-[12.5px] tw-font-semibold tw-text-primary hover:tw-underline"
            @click="isAddingAssistant = true"
          >
            Add assistant
          </button>
          <ComboBox
            v-else
            label="Add assistant"
            placeholder="Add assistant…"
            :showLabel="false"
            :options="rosterOptions"
            :modelValue="null"
            strategy="fixed"
            teleportTo="body"
            class="tw-mt-2"
            @update:modelValue="(option) => addPerson(option, TA_ROLE)"
          />
        </Disclosure>

        <div class="tw-h-px tw-bg-surface-container" />

        <Disclosure label="Notes" :summary="notesSummary">
          <textarea
            :id="fieldId('notes')"
            :value="draft.notes"
            rows="3"
            placeholder="Internal to the department"
            :class="[INPUT_CLASS, 'tw-w-full tw-py-2.5']"
            @input="edit({ notes: valueOf($event) })"
          />
        </Disclosure>
      </div>
    </div>

    <div
      v-if="isConfirmingCancel"
      role="alertdialog"
      class="tw-flex tw-flex-none tw-flex-col tw-gap-2 tw-border-0 tw-border-t tw-border-solid tw-border-outline-variant tw-bg-brand/[0.06] tw-px-[18px] tw-py-3.5"
    >
      <p class="tw-m-0 tw-text-[13.5px] tw-font-bold">
        Cancel {{ draft.subject }} {{ draft.catalogNumber }} ·
        {{ draft.section }}?
      </p>
      <p class="tw-m-0 tw-text-[12.5px] tw-leading-normal">
        It stays in the SIS, marked cancelled for {{ termName ?? "this term" }}.
        The registrar notifies the {{ section.enrollmentTotal }} enrolled
        students.
      </p>
      <div class="tw-flex tw-items-center tw-gap-3">
        <button
          type="button"
          class="tw-min-h-11 tw-cursor-pointer tw-rounded-full tw-border-none tw-bg-brand tw-px-5 tw-text-[13px] tw-font-bold tw-text-white"
          @click="confirmCancelSection"
        >
          Cancel section
        </button>
        <button
          type="button"
          class="tw-cursor-pointer tw-border-none tw-bg-transparent tw-p-0 tw-text-[13px] tw-font-semibold tw-text-on-surface-variant hover:tw-underline"
          @click="isConfirmingCancel = false"
        >
          Keep it
        </button>
      </div>
    </div>

    <p
      v-for="problem in generalProblems"
      :key="problem.message"
      class="tw-m-0 tw-px-[18px] tw-pt-2 tw-text-xs tw-text-red-700"
    >
      {{ problem.message }}
    </p>

    <!--
      Where Save stood. On a phone the sheet covers the screen, so this is the
      only place the lock can be named.
    -->
    <div
      v-if="isReadOnly"
      class="tw-flex tw-flex-none tw-items-center tw-gap-2 tw-border-0 tw-border-t tw-border-solid tw-border-outline-variant tw-bg-surface tw-px-[18px] tw-py-3"
    >
      <LockIcon class="tw-h-4 tw-w-4 tw-flex-none tw-text-on-surface-variant" />
      <span class="tw-text-xs tw-font-bold">Read only</span>
    </div>

    <div
      v-else
      class="tw-flex tw-flex-none tw-items-center tw-gap-2.5 tw-border-0 tw-border-t tw-border-solid tw-border-surface-container tw-bg-surface-bright tw-px-[18px] tw-pb-3 tw-pt-2.5"
    >
      <button
        type="button"
        class="tw-min-h-11 tw-rounded-full tw-border-none tw-bg-primary tw-px-6 tw-text-[13px] tw-font-bold tw-text-on-primary disabled:tw-cursor-default disabled:tw-bg-surface-container-high disabled:tw-text-on-surface-variant"
        :class="{ 'tw-cursor-pointer': isDirty && problems.length === 0 }"
        :disabled="!isDirty || problems.length > 0"
        @click="schedule.saveDraft(section.id)"
      >
        Save
      </button>
      <button
        v-if="isDirty"
        type="button"
        class="tw-cursor-pointer tw-border-none tw-bg-transparent tw-p-0 tw-text-[13px] tw-font-semibold tw-text-on-surface-variant hover:tw-underline"
        @click="schedule.cancelDraft(section.id)"
      >
        Discard
      </button>

      <div
        ref="menuContainerRef"
        class="tw-relative tw-ml-auto"
        @keydown.escape="isMenuOpen = false"
      >
        <button
          type="button"
          aria-label="More options"
          aria-haspopup="menu"
          :aria-expanded="isMenuOpen"
          class="tw-flex tw-h-11 tw-w-11 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-outline-variant tw-bg-surface-bright tw-text-on-surface-variant hover:tw-border-outline hover:tw-text-on-surface"
          @click="isMenuOpen = !isMenuOpen"
        >
          <VDotsIcon class="tw-h-4 tw-w-4" />
        </button>
        <div
          v-if="isMenuOpen"
          role="menu"
          class="tw-absolute tw-bottom-[52px] tw-right-0 tw-z-[60] tw-w-[212px] tw-rounded-[10px] tw-border tw-border-solid tw-border-outline-variant tw-bg-surface-bright tw-p-1.5 tw-shadow-[0_10px_28px_rgba(38,38,38,0.18)]"
        >
          <button
            type="button"
            role="menuitem"
            class="tw-block tw-w-full tw-min-h-11 tw-cursor-pointer tw-rounded-[7px] tw-border-none tw-bg-transparent tw-px-2.5 tw-text-left tw-text-[13px] tw-font-semibold tw-text-on-surface hover:tw-bg-surface disabled:tw-cursor-default disabled:tw-text-on-surface-variant disabled:hover:tw-bg-transparent"
            :disabled="!schedule.hasEdits(section.id)"
            @click="revertFromMenu"
          >
            Revert to SIS
          </button>
          <button
            type="button"
            role="menuitem"
            class="tw-block tw-w-full tw-min-h-11 tw-cursor-pointer tw-rounded-[7px] tw-border-none tw-bg-transparent tw-px-2.5 tw-text-left tw-text-[13px] tw-font-semibold tw-text-brand hover:tw-bg-brand/[0.06] disabled:tw-cursor-default disabled:tw-text-on-surface-variant disabled:hover:tw-bg-transparent"
            :disabled="draft.isCancelled"
            :title="
              draft.isCancelled
                ? 'This section is already cancelled'
                : undefined
            "
            @click="startCancelFromMenu"
          >
            Cancel section…
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onClickOutside } from "@vueuse/core";
import Disclosure from "./Disclosure.vue";
import SectionFacts from "./SectionFacts.vue";
import SegmentedControl, { type SegmentedOption } from "./SegmentedControl.vue";
import { ComboBox, type ComboBoxOptionType } from "@/components/ComboBox";
import { LockIcon, VDotsIcon } from "@/icons";
import { colorOfType, labelOfComponent } from "../constants/meetingTypeColors";
import { DELIVERY_OPTIONS, labelOfDelivery } from "../constants/delivery";
import {
  assistantsOf,
  initialsOf,
  instructorsOfRecord,
  PRIMARY_ROLE,
  TA_ROLE,
} from "../helpers/sectionPeople";
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
  roster: SisEmployee[];
  /** Names the list this sheet was opened from, e.g. "Tue · 2 – 3p", if any. */
  returnTo?: string | null;
  /** Draws the grab handle that marks a sheet pulled up over a small screen. */
  hasHandle?: boolean;
  /** Names the term in the cancel prompt, e.g. "Fall 2026". */
  termName?: string;
  /**
   * A term that takes no edits: every field becomes its value, and everything
   * that would have written is gone rather than dimmed.
   */
  isReadOnly?: boolean;
}>();

const emit = defineEmits<{ close: []; back: [] }>();

const LABEL_CLASS =
  "tw-m-0 tw-mb-2 tw-block tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-[0.07em] tw-text-on-surface-variant";

const INPUT_CLASS =
  "tw-min-h-11 tw-rounded-[10px] tw-border tw-border-solid tw-border-outline-variant tw-bg-surface-bright tw-px-3 tw-text-sm tw-text-on-surface focus:tw-border-primary focus:tw-outline-none";

const COMPONENT_CODES = ["LEC", "DIS", "LAB", "FWK", "IND"];

const ASYNC = "async";

const DAY_OPTIONS: SegmentedOption[] = [
  { value: "mon", label: "M" },
  { value: "tue", label: "T" },
  { value: "wed", label: "W" },
  { value: "thu", label: "Th" },
  { value: "fri", label: "F" },
  { value: ASYNC, label: "Async", isDashed: true },
];

const isAddingInstructor = ref(false);
const isAddingAssistant = ref(false);
const isConfirmingCancel = ref(false);
const isMenuOpen = ref(false);

const menuContainerRef = ref<HTMLElement | null>(null);
onClickOutside(menuContainerRef, () => {
  isMenuOpen.value = false;
});

const fieldId = (field: string) => `section-${props.section.id}-${field}`;

const draft = computed(() => props.schedule.draftSection(props.section));

const isDirty = computed(() => props.schedule.isDraftDirty(props.section));

const edit = (change: Parameters<ScheduleEditor["editSection"]>[1]) =>
  props.schedule.editSection(props.section.id, change);

const valueOf = (event: Event) =>
  (event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)
    .value;

/** A code the import has never sent still shows, rather than reading as LEC. */
const componentCodes = computed(() =>
  COMPONENT_CODES.includes(draft.value.component)
    ? COMPONENT_CODES
    : [...COMPONENT_CODES, draft.value.component],
);

const componentSummary = computed(
  () => `${draft.value.component} · ${labelOfDelivery(draft.value.delivery)}`,
);

// one empty group when there are none, so the day buttons still show
const patterns = computed(() =>
  draft.value.meetings.length === 0 ? [undefined] : draft.value.meetings,
);

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

const problemWith = (patternIndex: number) =>
  problems.value.find((problem) => problem.patternIndex === patternIndex)
    ?.message;

// an emptied cap is NaN, not 0, so the field stays blank while retyped
const capText = computed(() =>
  Number.isNaN(draft.value.enrollmentCap) ? "" : draft.value.enrollmentCap,
);

/** Falls back to the saved cap while the field is blank mid-edit. */
const capForDisplay = computed(() =>
  Number.isNaN(draft.value.enrollmentCap)
    ? props.section.enrollmentCap
    : draft.value.enrollmentCap,
);

const editCap = (raw: string) =>
  edit({ enrollmentCap: raw.trim() === "" ? NaN : Number(raw) });

const metaLine = computed(() =>
  [
    `${props.section.credits ?? "—"} credits`,
    `class ${props.section.classNumber}`,
    `${props.section.enrollmentTotal} of ${capForDisplay.value} seats filled`,
    props.schedule.hasEdits(props.section.id) ? "edited here" : "matches SIS",
  ].join(" · "),
);

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

function addPerson(option: ComboBoxOptionType | null, role: string) {
  const person = props.roster.find(({ emplid }) => emplid === option?.id);
  if (!person) return;

  edit({
    instructors: [
      ...draft.value.instructors,
      {
        emplid: person.emplid,
        role,
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

const instructorsOnRecord = computed(() =>
  instructorsOfRecord(draft.value.instructors),
);

const assistants = computed(() => assistantsOf(draft.value.instructors));

const notesSummary = computed(() => {
  const firstLine = draft.value.notes.trim().split("\n")[0];
  return firstLine ? firstLine : "Empty";
});

const partners = computed(() => props.section.crosslist?.partners ?? []);

const crosslistSummary = computed(() =>
  partners.value.length === 0 ? "None" : String(partners.value.length),
);

/** Null unless every partner is in this term's payload. */
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

function confirmCancelSection() {
  props.schedule.cancelSection(props.section.id);
  isConfirmingCancel.value = false;
}

function revertFromMenu() {
  props.schedule.revertSection(props.section.id);
  isMenuOpen.value = false;
}

function startCancelFromMenu() {
  isMenuOpen.value = false;
  isConfirmingCancel.value = true;
}
</script>
