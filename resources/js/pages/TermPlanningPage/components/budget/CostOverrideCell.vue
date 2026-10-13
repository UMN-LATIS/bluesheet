<template>
  <button
    v-if="canEdit && lines.length > 0"
    ref="anchor"
    type="button"
    aria-haspopup="dialog"
    :aria-expanded="isOpen"
    :aria-label="buttonLabel"
    class="tw-relative tw-flex tw-h-full tw-w-full tw-cursor-pointer tw-items-center tw-justify-end tw-whitespace-nowrap tw-border-none tw-bg-transparent tw-px-2 tw-text-xs tw-font-semibold tw-tabular-nums tw-text-on-surface hover:tw-underline"
    @click.stop="isOpen = !isOpen"
  >
    <slot />
    <OverrideMarker v-if="isOverridden" />
  </button>
  <span
    v-else
    class="tw-relative tw-flex tw-h-full tw-w-full tw-items-center tw-justify-end tw-whitespace-nowrap tw-px-2 tw-tabular-nums"
  >
    <slot />
    <OverrideMarker v-if="isOverridden" />
  </span>

  <Teleport v-if="isOpen" to="body">
    <div
      ref="panel"
      role="dialog"
      :aria-label="`${costLabel} for ${courseLabel}`"
      class="tw-z-[70] tw-flex tw-w-[300px] tw-flex-col tw-gap-3 tw-rounded-[10px] tw-border tw-border-solid tw-border-outline-variant tw-bg-surface-bright tw-p-3 tw-text-xs tw-shadow-lg"
      :style="{
        ...floatingStyles,
        visibility: middlewareData.hide?.referenceHidden ? 'hidden' : 'visible',
      }"
      @keydown.esc="close"
    >
      <CapsLabel>{{ costLabel }} · {{ courseLabel }}</CapsLabel>
      <div
        v-for="line in lines"
        :key="line.emplid"
        class="tw-flex tw-items-center tw-gap-2"
      >
        <span class="tw-min-w-0 tw-flex-1 tw-truncate tw-font-semibold">
          {{ line.name }}
        </span>
        <DollarInput
          class="tw-w-[110px] tw-overflow-hidden tw-rounded-md tw-border tw-border-solid"
          :class="
            line.isOverridden
              ? 'tw-border-[#e0a800] tw-bg-accent-container-low'
              : 'tw-border-outline-variant'
          "
          :amount="line.amount"
          :isDisabled="false"
          :label="`${costLabel} for ${line.name}`"
          @change="(amount) => editAmount(line, amount)"
        />
        <span class="tw-w-[26px]">
          <ResetButton
            v-if="line.isOverridden"
            :label="`Reset to ${defaultLabelOf(line)}`"
            @reset="emitEdit(line, null)"
          />
        </span>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import {
  autoUpdate,
  flip,
  hide,
  offset,
  shift,
  useFloating,
} from "@floating-ui/vue";
import { onClickOutside } from "@vueuse/core";
import { computed, nextTick, ref, watch } from "vue";
import CapsLabel from "./CapsLabel.vue";
import DollarInput from "./DollarInput.vue";
import OverrideMarker from "./OverrideMarker.vue";
import ResetButton from "./ResetButton.vue";
import type { OverridableLine } from "../../helpers/budgetRows";
import type { LineOverrideEdit } from "../../helpers/costOverrides";
import { formatDollars } from "../../helpers/money";

const props = defineProps<{
  lines: OverridableLine[];
  canEdit: boolean;
  courseLabel: string;
  costLabel: string;
}>();

const emit = defineEmits<{ editLine: [edit: LineOverrideEdit] }>();

const isOverridden = computed(() =>
  props.lines.some((line) => line.isOverridden),
);

const buttonLabel = computed(() => {
  const label = `Change ${props.costLabel} for ${props.courseLabel}`;

  return isOverridden.value ? `${label}, changed for this section` : label;
});

const isOpen = ref(false);
const anchor = ref<HTMLElement | null>(null);
const panel = ref<HTMLElement | null>(null);

const { floatingStyles, middlewareData } = useFloating(anchor, panel, {
  placement: "bottom-end",
  strategy: "fixed",
  middleware: [offset(4), flip(), shift({ padding: 8 }), hide()],
  whileElementsMounted: autoUpdate,
});

onClickOutside(panel, () => (isOpen.value = false), { ignore: [anchor] });

watch(isOpen, async (open) => {
  if (!open) return;
  await nextTick();
  panel.value?.querySelector("input")?.focus();
});

function close() {
  isOpen.value = false;
  anchor.value?.focus();
}

const defaultLabelOf = ({ defaultAmount }: OverridableLine) =>
  defaultAmount === null ? "no rate" : formatDollars(defaultAmount);

function emitEdit(line: OverridableLine, amount: number | null) {
  emit("editLine", {
    courseCode: line.courseCode,
    section: line.section,
    emplid: line.emplid,
    amount,
  });
}

function editAmount(line: OverridableLine, amount: number | null) {
  const isDefault = amount === null || amount === line.defaultAmount;
  emitEdit(line, isDefault ? null : amount);
}
</script>
