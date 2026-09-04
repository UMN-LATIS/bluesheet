<template>
  <aside
    aria-label="Section details"
    class="tw-flex tw-h-full tw-w-full tw-flex-col tw-min-h-0 tw-bg-surface-bright tw-text-on-surface"
  >
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
        <UnofficialTag v-if="isUnofficial" />
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
        <template v-if="isNew && !draft.courseCode">New section</template>
        <template v-else>
          {{ draft.subject }} {{ draft.catalogNumber }} · {{ draft.section }}
        </template>
        <!-- How many other numbers this same class is listed under. -->
        <span v-if="partners.length > 0" class="tw-text-on-surface-variant">
          [+{{ partners.length }}]
        </span>
      </h2>

      <p
        class="tw-m-0 tw-truncate tw-text-[12.5px] tw-text-on-surface-variant"
        :title="draft.title"
      >
        {{ draft.title || "Pick a course to name it" }}
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
      <CoursePicker
        v-if="isNew"
        :groupId="groupId"
        :termCode="section.termId"
        :modelValue="draft.courseCode ?? null"
        @update:modelValue="chooseCourse"
      />

      <div>
        <FieldLabel :for="fieldId('section')">Section</FieldLabel>
        <input
          :id="fieldId('section')"
          :value="draft.section"
          type="text"
          class="field-control tw-w-24"
          @input="edit({ section: valueOf($event) })"
        />
      </div>

      <div>
        <FieldLabel>Meets</FieldLabel>
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
                  class="field-control"
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
                  class="field-control"
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

      <FieldDivider />

      <div>
        <FieldLabel>Taught by</FieldLabel>
        <div class="tw-flex tw-flex-col tw-gap-2">
          <PersonField
            v-for="instructor in instructorsOnRecord"
            :key="instructor.emplid"
            :instructor="instructor"
            role="Instructor of record"
            @remove="removeInstructor(instructor.emplid)"
          />
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

      <FieldDivider />

      <!--
        Alongside the instructor of record rather than folded away below, since
        a discussion or a lab is usually run by the people in this list and the
        SIS names no instructor of record on it at all.
      -->
      <div>
        <FieldLabel>Teaching assistants</FieldLabel>
        <div v-if="assistants.length > 0" class="tw-flex tw-flex-col tw-gap-2">
          <PersonField
            v-for="instructor in assistants"
            :key="instructor.emplid"
            :instructor="instructor"
            :role="instructor.role"
            @remove="removeInstructor(instructor.emplid)"
          />
        </div>
        <p v-else class="tw-m-0 tw-text-[13px] tw-text-on-surface-variant">
          None
        </p>

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
      </div>

      <FieldDivider />

      <div>
        <FieldLabel :for="fieldId('cap')">Enrollment cap</FieldLabel>
        <div class="tw-flex tw-items-center tw-gap-3">
          <input
            :id="fieldId('cap')"
            :value="capText"
            type="number"
            min="0"
            class="field-control tw-w-24"
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

      <FieldDivider />

      <div class="tw-flex tw-flex-col tw-gap-3.5">
        <Disclosure label="Component & delivery" :summary="componentSummary">
          <div class="tw-flex tw-gap-3">
            <div class="tw-min-w-0 tw-flex-1">
              <FieldLabel variant="control" :for="fieldId('component')">
                Component
              </FieldLabel>
              <select
                :id="fieldId('component')"
                :value="draft.component"
                class="field-control tw-w-full"
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
              <FieldLabel variant="control" :for="fieldId('delivery')">
                Delivery
              </FieldLabel>
              <select
                :id="fieldId('delivery')"
                :value="draft.delivery"
                class="field-control tw-w-full"
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

        <FieldDivider />

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

        <FieldDivider />

        <Disclosure label="Notes" :summary="notesSummary">
          <textarea
            :id="fieldId('notes')"
            :value="draft.notes"
            rows="3"
            placeholder="Internal to the department"
            class="field-control tw-w-full tw-py-2.5"
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

    <div
      v-if="isConfirmingDelete"
      role="alertdialog"
      class="tw-flex tw-flex-none tw-flex-col tw-gap-2 tw-border-0 tw-border-t tw-border-solid tw-border-outline-variant tw-bg-brand/[0.06] tw-px-[18px] tw-py-3.5"
    >
      <p class="tw-m-0 tw-text-[13.5px] tw-font-bold">
        Delete {{ draft.subject }} {{ draft.catalogNumber }} ·
        {{ draft.section }}?
      </p>
      <p class="tw-m-0 tw-text-[12.5px] tw-leading-normal">
        It leaves {{ termName ?? "this term" }} for everyone.
        {{ draft.title }} stays on the course list, so a later term can still
        plan it.
      </p>

      <!--
        Reaching for Delete often means "not on Tuesdays" rather than "not at
        all", so each meeting can go on its own from here.
      -->
      <div
        v-if="draft.meetings.length > 0"
        class="tw-flex tw-flex-col tw-gap-1.5"
      >
        <p
          class="tw-m-0 tw-text-[11px] tw-font-bold tw-uppercase tw-tracking-[0.06em] tw-text-on-surface-variant"
        >
          Meets
        </p>
        <div
          v-for="(pattern, patternIndex) in draft.meetings"
          :key="patternIndex"
          class="tw-flex tw-items-center tw-justify-between tw-gap-2 tw-rounded-lg tw-bg-surface-bright tw-px-3 tw-py-2 tw-text-[13px]"
        >
          <span>{{ describePattern(pattern) }}</span>
          <button
            type="button"
            class="tw-flex-none tw-cursor-pointer tw-border-none tw-bg-transparent tw-p-0 tw-text-[12.5px] tw-font-semibold tw-text-primary hover:tw-underline"
            @click="removeMeetingOnly(patternIndex)"
          >
            Remove this meeting
          </button>
        </div>
      </div>

      <div class="tw-flex tw-items-center tw-gap-3">
        <button
          type="button"
          class="tw-min-h-11 tw-cursor-pointer tw-rounded-full tw-border-none tw-bg-brand tw-px-5 tw-text-[13px] tw-font-bold tw-text-white"
          @click="confirmDelete"
        >
          Delete section
        </button>
        <button
          type="button"
          class="tw-cursor-pointer tw-border-none tw-bg-transparent tw-p-0 tw-text-[13px] tw-font-semibold tw-text-on-surface-variant hover:tw-underline"
          @click="isConfirmingDelete = false"
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
      v-else-if="isNew"
      class="tw-flex tw-flex-none tw-items-center tw-gap-2.5 tw-border-0 tw-border-t tw-border-solid tw-border-surface-container tw-bg-surface-bright tw-px-[18px] tw-pb-3 tw-pt-2.5"
    >
      <button
        type="button"
        class="tw-min-h-11 tw-rounded-full tw-border-none tw-bg-primary tw-px-6 tw-text-[13px] tw-font-bold tw-text-on-primary disabled:tw-cursor-default disabled:tw-bg-surface-container-high disabled:tw-text-on-surface-variant"
        :class="{ 'tw-cursor-pointer': canCreate }"
        :disabled="!canCreate"
        @click="emit('create')"
      >
        Create section
      </button>
      <button
        type="button"
        class="tw-cursor-pointer tw-border-none tw-bg-transparent tw-p-0 tw-text-[13px] tw-font-semibold tw-text-on-surface-variant hover:tw-underline"
        @click="emit('discard')"
      >
        Cancel
      </button>
      <p
        v-if="!draft.courseCode"
        class="tw-m-0 tw-ml-auto tw-text-[12px] tw-text-on-surface-variant"
      >
        Pick a course first
      </p>
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
          <button
            type="button"
            role="menuitem"
            class="tw-block tw-w-full tw-min-h-11 tw-cursor-pointer tw-rounded-[7px] tw-border-none tw-bg-transparent tw-px-2.5 tw-text-left tw-text-[13px] tw-font-semibold tw-text-brand hover:tw-bg-brand/[0.06]"
            @click="startDeleteFromMenu"
          >
            Delete section…
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onClickOutside } from "@vueuse/core";
import CoursePicker from "./CoursePicker.vue";
import UnofficialTag from "./UnofficialTag.vue";
import Disclosure from "./Disclosure.vue";
import FieldDivider from "./FieldDivider.vue";
import FieldLabel from "./FieldLabel.vue";
import PersonField from "./PersonField.vue";
import SectionFacts from "./SectionFacts.vue";
import SegmentedControl, { type SegmentedOption } from "./SegmentedControl.vue";
import { ComboBox, type ComboBoxOptionType } from "@/components/ComboBox";
import { LockIcon, VDotsIcon } from "@/icons";
import { colorOfType, labelOfComponent } from "../constants/meetingTypeColors";
import { DELIVERY_OPTIONS, labelOfDelivery } from "../constants/delivery";
import {
  assistantsOf,
  instructorsOfRecord,
  PRIMARY_ROLE,
  TA_ROLE,
} from "../helpers/sectionPeople";
import { formatTimeRange, minutesFromClock } from "../helpers/timeScale";
import { NEW_SECTION_ID } from "../useScheduleEditor/types";
import type {
  Delivery,
  PlannableCourse,
  PlannedSection,
  SisDay,
  SisEmployee,
  SisSectionMeeting,
} from "../types";
import type { ScheduleEditor } from "../useScheduleEditor";

const props = defineProps<{
  section: PlannedSection;
  schedule: ScheduleEditor;
  /** Which department's catalogue the course picker offers. */
  groupId: number;
  /** On a course a scheduler named, which the SIS has never published. */
  isUnofficial?: boolean;
  /** The term's sections, for reading a cross-list partner's cap. */
  sections: PlannedSection[];
  roster: SisEmployee[];
  /** Names the list this sheet was opened from, e.g. "Tue · 2 – 3p", if any. */
  returnTo?: string | null;
  /** Names the term in the cancel prompt, e.g. "Fall 2026". */
  termName?: string;
  /**
   * A term that takes no edits: every field becomes its value, and everything
   * that would have written is gone rather than dimmed.
   */
  isReadOnly?: boolean;
}>();

const emit = defineEmits<{
  close: [];
  back: [];
  /** Create was pressed; the page writes the draft to the server. */
  create: [];
  /** Cancel was pressed on a section that was never created. */
  discard: [];
  delete: [];
}>();

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
const isConfirmingDelete = ref(false);
const isMenuOpen = ref(false);

const menuContainerRef = ref<HTMLElement | null>(null);
onClickOutside(menuContainerRef, () => {
  isMenuOpen.value = false;
});

const fieldId = (field: string) => `section-${props.section.id}-${field}`;

const draft = computed(() => props.schedule.draftSection(props.section));

/** No row exists for this one yet; see `NEW_SECTION_ID`. */
const isNew = computed(() => props.section.id === NEW_SECTION_ID);

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

const metaLine = computed(() => {
  const credits = `${draft.value.credits ?? "—"} credits`;

  if (isNew.value) return `${credits} · not created yet`;

  return [
    credits,
    `class ${props.section.classNumber ?? "—"}`,
    `${props.section.enrollmentTotal} of ${capForDisplay.value} seats filled`,
    props.schedule.hasEdits(props.section.id) ? "edited here" : "matches SIS",
  ].join(" · ");
});

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

const chooseCourse = (course: PlannableCourse) =>
  edit({
    courseCode: course.courseCode,
    subject: course.subject,
    catalogNumber: course.catalogNumber,
    title: course.title,
    credits: course.credits,
  });

const canCreate = computed(
  () =>
    Boolean(draft.value.courseCode) &&
    draft.value.section.trim() !== "" &&
    problems.value.length === 0,
);

const DAY_LABELS: Record<SisDay, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

/** "Mon, Wed · 10:10 – 11a", as the delete prompt lists a meeting. */
const describePattern = (pattern: SisSectionMeeting) =>
  `${pattern.days.map((day) => DAY_LABELS[day]).join(", ")} · ${formatTimeRange(
    minutesFromClock(pattern.startTime),
    minutesFromClock(pattern.endTime),
  )}`;

// straight through the draft to the saved edits: the prompt has already asked
function removeMeetingOnly(patternIndex: number) {
  props.schedule.removeMeetingPattern(props.section.id, patternIndex);
  props.schedule.saveDraft(props.section.id);

  if (draft.value.meetings.length === 0) isConfirmingDelete.value = false;
}

function confirmDelete() {
  isConfirmingDelete.value = false;
  emit("delete");
}

function startDeleteFromMenu() {
  isMenuOpen.value = false;
  isConfirmingDelete.value = true;
}

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

<style scoped>
/*
 * Every control on the sheet — text, number, time, select, textarea — wears
 * one border and one focus ring. Written here rather than repeated across
 * five kinds of element, and only the box: width and padding stay on the
 * element, where the field that needs a wider one can say so.
 */
.field-control {
  min-height: 44px;
  border: 1px solid var(--outline-variant);
  border-radius: 10px;
  background-color: var(--surface-bright);
  padding-inline: 0.75rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: var(--on-surface);
}

.field-control:focus {
  border-color: var(--primary);
  outline: none;
}
</style>
