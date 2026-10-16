<template>
  <aside
    aria-label="Person details"
    class="tw-flex tw-h-full tw-w-full tw-min-h-0 tw-flex-col tw-bg-surface-bright tw-text-on-surface"
  >
    <div
      class="tw-flex-none tw-border-0 tw-border-b tw-border-solid tw-border-outline-variant tw-px-[18px] tw-pb-3 tw-pt-3.5"
    >
      <div class="tw-flex tw-items-center tw-gap-2">
        <span
          v-if="personRow"
          class="tw-inline-flex tw-h-5 tw-items-center tw-rounded-full tw-border tw-border-solid tw-border-outline-variant tw-px-2.5 tw-text-[10px] tw-font-bold tw-tabular-nums"
        >
          {{ personRow.jobCode }}
        </span>
        <span
          v-if="personRow && personRow.fundLabel !== '—'"
          class="tw-text-[11px] tw-text-on-surface-variant"
        >
          {{ personRow.fundLabel }}
        </span>
        <button
          type="button"
          aria-label="Close"
          class="tw-ml-auto tw-flex tw-h-11 tw-w-11 tw-flex-none tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-full tw-border-none tw-bg-transparent tw-text-xl tw-leading-none tw-text-on-surface-variant hover:tw-bg-surface-container hover:tw-text-on-surface"
          @click="emit('close')"
        >
          ×
        </button>
      </div>

      <h2
        class="tw-m-0 tw-mt-0.5 tw-text-[19px] tw-font-bold tw-tracking-tight"
      >
        {{ name }}
      </h2>
      <p
        v-if="title"
        class="tw-m-0 tw-truncate tw-text-[13px] tw-text-on-surface-variant"
      >
        {{ title }}
      </p>
      <p
        v-if="personRow"
        class="tw-m-0 tw-mt-1.5 tw-text-[11px] tw-text-on-surface-variant"
      >
        Load {{ personRow.loadLabel }}
      </p>
    </div>

    <div
      class="scrollbar-always-visible tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-gap-4 tw-overflow-y-auto tw-p-[18px]"
    >
      <div
        v-if="
          personRow &&
          personRow.emplid !== null &&
          personRow.appointmentPercent !== null
        "
        class="tw-flex-none"
      >
        <FieldLabel class="tw-mb-1.5">
          Grad appointment · {{ personRow.appointmentPercent }}%
        </FieldLabel>
        <div
          class="tw-flex tw-flex-col tw-gap-2.5 tw-rounded-[10px] tw-bg-surface tw-p-3 tw-text-[13px]"
        >
          <label class="tw-flex tw-items-center tw-justify-between tw-gap-3">
            <span class="tw-flex tw-flex-col">
              Student fee offset
              <span
                v-if="personRow.isAbd"
                class="tw-text-[11px] tw-text-on-surface-variant"
              >
                {{ FEE_OFFSET_ABD_REASON }}
              </span>
            </span>
            <GradCheckbox
              :isChecked="personRow.hasFeeOffset && !personRow.isAbd"
              :canEdit="canEdit && !personRow.isAbd"
              :disabledReason="
                personRow.isAbd ? FEE_OFFSET_ABD_REASON : undefined
              "
              :label="`Student fee offset for ${name}`"
              @change="
                (isChecked) => editGradSettings({ hasFeeOffset: isChecked })
              "
            />
          </label>
          <label class="tw-flex tw-items-center tw-justify-between tw-gap-3">
            <span>International GA offset</span>
            <GradCheckbox
              :isChecked="personRow.isInternational"
              :canEdit="canEdit"
              :label="`International GA offset for ${name}`"
              @change="
                (isChecked) => editGradSettings({ isInternational: isChecked })
              "
            />
          </label>
        </div>
      </div>

      <div v-if="personRow && personRow.emplid !== null" class="tw-flex-none">
        <FieldLabel class="tw-mb-1.5">Cost this term</FieldLabel>
        <CostReceipt
          :lines="personRow.receipt"
          :canEdit="canEdit"
          :personName="name"
          @editInput="(field, value) => emit('editInput', field, value)"
        />
      </div>

      <div class="tw-flex-none">
        <FieldLabel class="tw-mb-1.5">Sections this term</FieldLabel>
        <p
          v-if="termSections.length === 0"
          class="tw-m-0 tw-text-[13px] tw-text-on-surface-variant"
        >
          No sections
        </p>
        <div class="tw-flex tw-flex-col tw-gap-2">
          <div
            v-for="termSection in termSections"
            :key="termSection.sectionId"
            class="tw-flex tw-flex-col tw-gap-1 tw-rounded-[10px] tw-bg-surface tw-p-2.5"
          >
            <div class="tw-flex tw-items-center tw-gap-2.5">
              <SectionChip
                class="tw-flex-none"
                :label="termSection.label"
                :component="termSection.component"
                :isReadOnly="isReadOnly"
                @click="emit('selectSection', termSection.sectionId)"
              />
              <span
                class="tw-min-w-0 tw-flex-1 tw-truncate tw-text-[13px] tw-font-semibold"
              >
                {{ termSection.title }}
              </span>
              <span
                v-if="termSection.amount !== undefined"
                class="tw-flex-none tw-text-[13px] tw-font-semibold tw-tabular-nums"
              >
                <MissingRate v-if="termSection.amount === null" />
                <template v-else>
                  {{ formatWholeDollars(termSection.amount) }}
                </template>
              </span>
            </div>
            <span
              class="tw-block tw-truncate tw-text-[11px] tw-text-on-surface-variant"
            >
              {{ termSection.meetingSummary
              }}{{ termSection.isTa ? " · TA" : "" }}
            </span>
            <span
              v-if="termSection.unpaidReason"
              class="tw-block tw-text-[11px] tw-text-on-surface-variant"
            >
              {{ termSection.unpaidReason }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="personRow && personRow.emplid !== null" class="tw-flex-none">
        <FieldLabel for="person-notes" class="tw-mb-1.5">Notes</FieldLabel>
        <textarea
          id="person-notes"
          :value="personRow.notes"
          :disabled="!canEdit"
          rows="3"
          class="tw-box-border tw-w-full tw-resize-y tw-rounded-[10px] tw-border tw-border-solid tw-border-outline-variant tw-bg-surface-bright tw-p-2.5 tw-text-[13px] tw-text-on-surface disabled:tw-cursor-default"
          @input="
            emit('editNotes', ($event.target as HTMLTextAreaElement).value)
          "
        />
      </div>

      <div class="tw-flex-none tw-rounded-[10px] tw-bg-surface">
        <Disclosure label="Teaching history" :summary="historySummary">
          <p
            v-if="taughtTerms === null"
            class="tw-m-0 tw-text-xs tw-text-on-surface-variant"
          >
            Loading…
          </p>
          <p
            v-else-if="taughtTerms.length === 0"
            class="tw-m-0 tw-text-xs tw-text-on-surface-variant"
          >
            No sections in the last five years
          </p>
          <div
            v-else
            class="tw-grid tw-grid-cols-[auto_minmax(0,1fr)_auto] tw-items-center tw-gap-x-2 tw-gap-y-1 tw-text-[11.5px]"
          >
            <template v-for="term in taughtTerms" :key="term.termCode">
              <template
                v-for="(taught, index) in term.sections"
                :key="taught.key"
              >
                <span class="tw-text-on-surface-variant">
                  {{ index === 0 ? term.termName : "" }}
                </span>
                <span class="tw-flex tw-min-w-0 tw-items-center tw-gap-2">
                  <SectionChip
                    class="tw-flex-none"
                    disabled
                    :isReadOnly="isReadOnly"
                    :label="taught.label"
                    :component="taught.component"
                  />
                  <span class="tw-truncate" :title="taught.title">
                    {{ taught.isTa ? "(TA) " : "" }}{{ taught.title }}
                  </span>
                </span>
                <EnrollmentTile
                  class="tw-justify-self-end tw-rounded-sm tw-px-1.5 tw-py-0.5 tw-text-center tw-font-bold tw-tabular-nums"
                  :enrollment="taught.enrollment"
                >
                  {{ taught.enrolledOfCap ?? "—" }}
                </EnrollmentTile>
              </template>
            </template>
          </div>
        </Disclosure>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from "vue";
import FieldLabel from "@/components/planning/FieldLabel.vue";
import Disclosure from "./Disclosure.vue";
import EnrollmentTile from "./EnrollmentTile.vue";
import SectionChip from "./SectionChip.vue";
import CostReceipt from "./budget/CostReceipt.vue";
import GradCheckbox from "./budget/GradCheckbox.vue";
import MissingRate from "./budget/MissingRate.vue";
import type { GradPerson } from "@/types";
import { countLabel } from "../helpers/countLabel";
import { FEE_OFFSET_ABD_REASON } from "../helpers/gradCost";
import { formatWholeDollars } from "../helpers/money";
import { gradPersonEditOf, type PersonRow } from "../helpers/peopleRows";
import type { PersonNumberField } from "../helpers/personInputs";
import type { PersonTermSection, TaughtTerm } from "../helpers/personPanel";

const props = defineProps<{
  name: string;
  title: string | null;
  /** Null outside the Budget view. */
  personRow: PersonRow | null;
  /**
   * Whether notes, a grad student's settings, and the
   * receipt's inputs take edits.
   */
  canEdit: boolean;
  isReadOnly: boolean;
  termSections: PersonTermSection[];
  /** Null while loading. */
  taughtTerms: TaughtTerm[] | null;
}>();

const emit = defineEmits<{
  close: [];
  selectSection: [sectionId: number];
  editInput: [field: PersonNumberField, value: number | null];
  editNotes: [notes: string];
  editGradPerson: [edit: GradPerson];
}>();

function editGradSettings(change: Partial<Omit<GradPerson, "emplid">>) {
  if (props.personRow === null) return;

  const edit = gradPersonEditOf(props.personRow, change);
  if (edit !== null) emit("editGradPerson", edit);
}

const historySummary = computed(() => {
  const [latest] = props.taughtTerms ?? [];
  if (!latest) return "";

  const sectionLabel = countLabel(
    latest.sections.length,
    "section",
    "sections",
  );
  return `${latest.termName} · ${sectionLabel}`;
});
</script>
