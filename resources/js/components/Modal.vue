<template>
  <dialog
    ref="dialogRef"
    v-bind="$attrs"
    class="modal-container"
    :aria-labelledby="title ? titleId : undefined"
    @cancel.prevent="handleCancel"
    @close="handleNativeClose"
    @keydown.escape.stop
    @mousedown.self="$emit('close')"
  >
    <!-- `v-if` keeps closed modals cheap: some callers render many Modal
         instances with only `show` toggled, and without it every hidden
         modal's slot content mounts (and holds state) from page load.
         Cost: the body empties at close, so the dialog fades out empty. -->
    <div v-if="show" class="modal-content">
      <div v-if="title" class="modal-header">
        <h5 :id="titleId" class="modal-title">{{ title }}</h5>
        <button
          type="button"
          class="close"
          aria-label="Close"
          @click="$emit('close')"
        >
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">
        <slot></slot>
      </div>
      <div v-if="$slots.footer" class="modal-footer">
        <slot name="footer" />
      </div>
    </div>
  </dialog>
</template>

<script setup lang="ts">
import { ref, useId, watchEffect } from "vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    title?: string;
    show: boolean;
    closeOnEsc?: boolean;
  }>(),
  {
    title: "",
    closeOnEsc: true,
  },
);

const emit = defineEmits<{ close: [] }>();

const dialogRef = ref<HTMLDialogElement | null>(null);
const titleId = useId();

/**
 * This lets `show` be the "truth" for whether a dialog is open
 * or not. When the prop changes, we update the dialog.
 */
function syncDialogToShowProp() {
  const dialog = dialogRef.value;
  if (!dialog) return;

  if (props.show && !dialog.open) {
    dialog.showModal();
  } else if (!props.show && dialog.open) {
    dialog.close();
  }
}

// The `cancel` event is Escape. The keydown behind it is stopped in the
// template: `cancel` is what closes the dialog, and a page listening for
// Escape on window would otherwise act on the same press.
// We always prevent the browser's own close
// so that the dialog's open state stays owned by the `show` prop, then ask
// the parent to close by flipping that prop.
function handleCancel() {
  if (props.closeOnEsc) {
    emit("close");
  }
}

// The dialog can close without a `close` emit reaching the parent: Chrome
// ignores `cancel.prevent` on a second Escape press, and a
// `<form method="dialog">` in the slot closes the dialog directly. Re-emit
// so the `show` prop catches up.
function handleNativeClose() {
  if (props.show) {
    emit("close");
  }
}

// re-runs when the template ref populates on mount, so this
// also handles a dialog that starts with `show` already true
watchEffect(syncDialogToShowProp);
</script>

<style>
.modal-container {
  width: 80%;
  max-width: 600px;
  margin: 40px auto;
  /* padding lives on .modal-content so a mousedown targeting the
     dialog element itself (@mousedown.self) can only be a backdrop
     click, never a click in the dialog's own padding */
  padding: 0;
  border: none;
  background-color: #fff;
  border-radius: 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
  font-family: Helvetica, Arial, sans-serif;
}

/* `allow-discrete` keeps `display` and the top layer alive for the duration of
   the exit transition, and `@starting-style` supplies the entry "from" values.
   Without both, an element that toggles `display` snaps in and out. */
.modal-container,
.modal-container::backdrop {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease,
    overlay 0.3s ease allow-discrete,
    display 0.3s ease allow-discrete;
}

.modal-container:not([open]),
.modal-container:not([open])::backdrop {
  opacity: 0;
}

.modal-container:not([open]) {
  transform: scale(1.1);
}

@starting-style {
  .modal-container[open],
  .modal-container[open]::backdrop {
    opacity: 0;
  }

  .modal-container[open] {
    transform: scale(1.1);
  }
}

.modal-container::backdrop {
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-content {
  padding: 1rem;
}

body:has(.modal-container[open]) {
  overflow: hidden;
}
</style>
