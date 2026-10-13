<template>
  <button
    v-if="canEdit && lines.length > 0"
    ref="anchor"
    type="button"
    :aria-expanded="isOpen"
    :aria-label="`Change ${costLabel} for ${courseLabel}`"
    :title="basisLabel"
    class="tw-relative tw-flex tw-h-full tw-w-full tw-cursor-pointer tw-items-center tw-justify-end tw-whitespace-nowrap tw-border-none tw-bg-transparent tw-px-2 tw-text-xs tw-font-semibold tw-tabular-nums tw-text-on-surface hover:tw-underline"
    @click.stop="isOpen = !isOpen"
  >
    <slot />
    <OverrideMarker v-if="isOverridden" />
  </button>
  <span
    v-else
    :title="basisLabel"
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
      :style="floatingStyles"
      @keydown.esc="close"
    >
      <CapsLabel>{{ costLabel }} · {{ courseLabel }}</CapsLabel>
      <div
        v-for="line in lines"
        :key="line.emplid"
        class="tw-flex tw-flex-col tw-gap-1.5"
      >
        <div class="tw-flex tw-items-center tw-gap-2">
          <span class="tw-min-w-0 tw-flex-1 tw-truncate tw-font-semibold">
            {{ line.name }}
          </span>
          <DollarInput
            class="tw-w-[110px]"
            :amount="line.amount"
            :isChanged="line.isOverridden"
            :isDisabled="false"
            :label="`${costLabel} for ${line.name}`"
            placeholder="No rate"
            @change="(amount) => editAmount(line, amount)"
          />
          <span class="tw-w-[26px]">
            <ResetButton
              v-if="line.isOverridden"
              :label="`Reset to ${defaultLabelOf(line)}`"
              @reset="emitEdit(line, null, null)"
            />
          </span>
        </div>
        <input
          v-if="line.isOverridden"
          :value="line.reason ?? ''"
          :aria-label="`Why ${line.name}'s cost differs`"
          placeholder="Why does this differ?"
          class="tw-min-h-8 tw-rounded-lg tw-border tw-border-solid tw-border-outline-variant tw-bg-surface-bright tw-px-2.5 tw-text-xs tw-text-on-surface"
          @input="editReason(line, $event)"
        />
        <span class="tw-text-[11px] tw-text-on-surface-variant">
          Default {{ defaultLabelOf(line) }}. Applies to this section only.
        </span>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { autoUpdate, flip, offset, shift, useFloating } from "@floating-ui/vue";
import { onClickOutside } from "@vueuse/core";
import { nextTick, ref, watch } from "vue";
import CapsLabel from "./CapsLabel.vue";
import DollarInput from "./DollarInput.vue";
import OverrideMarker from "./OverrideMarker.vue";
import ResetButton from "./ResetButton.vue";
import type { OverridableLine } from "../../helpers/budgetRows";
import type { LineOverrideEdit } from "../../helpers/costOverrides";
import { formatWholeDollars } from "../../helpers/money";

defineProps<{
  lines: OverridableLine[];
  isOverridden: boolean;
  canEdit: boolean;
  courseLabel: string;
  costLabel: string;
  basisLabel: string;
}>();

const emit = defineEmits<{ editLine: [edit: LineOverrideEdit] }>();

const isOpen = ref(false);
const anchor = ref<HTMLElement | null>(null);
const panel = ref<HTMLElement | null>(null);

const { floatingStyles } = useFloating(anchor, panel, {
  placement: "bottom-end",
  strategy: "fixed",
  middleware: [offset(4), flip(), shift({ padding: 8 })],
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
  defaultAmount === null ? "no rate" : formatWholeDollars(defaultAmount);

function emitEdit(
  line: OverridableLine,
  amount: number | null,
  reason: string | null,
) {
  emit("editLine", {
    courseCode: line.courseCode,
    section: line.section,
    emplid: line.emplid,
    amount,
    reason,
  });
}

function editAmount(line: OverridableLine, amount: number | null) {
  const isDefault = amount === null || amount === line.defaultAmount;
  emitEdit(line, isDefault ? null : amount, isDefault ? null : line.reason);
}

function editReason(line: OverridableLine, event: Event) {
  const reason = (event.target as HTMLInputElement).value;
  emitEdit(line, line.amount, reason.trim() === "" ? null : reason);
}
</script>
