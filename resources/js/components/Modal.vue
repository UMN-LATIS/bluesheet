<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-mask" @mousedown="$emit('close')">
        <div class="modal-container" v-bind="$attrs" @mousedown.stop>
          <div v-if="title" class="modal-header">
            <h5 class="modal-title">{{ title }}</h5>
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
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";

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

const emit = defineEmits<{
  (eventName: "close");
}>();

function closeModalOnEsc(event: KeyboardEvent) {
  if (props.show && event.key === "Escape") {
    emit("close");
  }
}

onMounted(() => {
  if (props.closeOnEsc) {
    document.addEventListener("keydown", closeModalOnEsc);
  }
});

onUnmounted(() => {
  if (props.closeOnEsc) {
    document.removeEventListener("keydown", closeModalOnEsc);
  }
});
</script>

<style>
.modal-enter-from {
  opacity: 0;
}

.modal-leave-active {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-active .modal-container {
  -webkit-transform: scale(1.1);
  transform: scale(1.1);
}

.modal-mask {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  transition: opacity 0.3s ease;
}

.modal-container {
  width: 80%;
  max-width: 600px;
  margin: 40px auto 0;
  padding: 1rem;
  background-color: #fff;
  border-radius: 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
  transition: all 0.3s ease;
  font-family: Helvetica, Arial, sans-serif;
}
</style>
