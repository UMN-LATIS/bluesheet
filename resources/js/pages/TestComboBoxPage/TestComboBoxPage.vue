<template>
  <PostIt class="tw-mb-4">
    <h1>Test Combobox Page</h1>
    <ComboBox
      v-model="selectedOption"
      :options="options"
      label="New ComboBox"
      class="tw-mb-4"
    />

    <p>
      Lorem ipsum dolor sit, amet consectetur adipisicing elit. Nam labore
      aliquid sed maxime fuga deleniti alias dolorum! Debitis, mollitia
      provident repellendus, asperiores aut doloribus deserunt, animi nam ab
      dolorum itaque.
    </p>
    <p>
      Lorem ipsum dolor sit, amet consectetur adipisicing elit. Nam labore
      aliquid sed maxime fuga deleniti alias dolorum! Debitis, mollitia
      provident repellendus, asperiores aut doloribus deserunt, animi nam ab
      dolorum itaque.
    </p>
    <p>
      Lorem ipsum dolor sit, amet consectetur adipisicing elit. Nam labore
      aliquid sed maxime fuga deleniti alias dolorum! Debitis, mollitia
      provident repellendus, asperiores aut doloribus deserunt, animi nam ab
      dolorum itaque.
    </p>
    <p>
      Lorem ipsum dolor sit, amet consectetur adipisicing elit. Nam labore
      aliquid sed maxime fuga deleniti alias dolorum! Debitis, mollitia
      provident repellendus, asperiores aut doloribus deserunt, animi nam ab
      dolorum itaque.
    </p>

    <h2>Scrollable Container</h2>

    <div class="tw-h-[200px] tw-overflow-y-auto tw-border tw-p-4 tw-mb-8">
      <p>
        Lorem ipsum dolor sit, amet consectetur adipisicing elit. Nam labore
        aliquid sed maxime fuga deleniti alias dolorum! Debitis, mollitia
        provident repellendus, asperiores aut doloribus deserunt, animi nam ab
        dolorum itaque.
      </p>
      <ComboBox
        v-model="selectedOption"
        :options="options"
        label="New ComboBox"
      />
    </div>

    <Button @click="isModalOpen = true">Open Modal</Button>

    <Modal :show="isModalOpen" @close="isModalOpen = false">
      <div class="tw-flex tw-flex-col tw-gap-4">
        <h1>Test Combobox Modal</h1>
        <ComboBox
          v-model="selectedOption"
          :options="options"
          label="New ComboBox"
        />
      </div>
    </Modal>
  </PostIt>
</template>
<script setup lang="ts">
import { PostIt } from "@umn-latis/cla-vue-template";
import { options } from "./options";
import { ComboBox, ComboBoxOptionType } from "@/components/ComboBox";
import { ref } from "vue";

import Modal from "@/components/Modal.vue";
import Button from "@/components/Button.vue";

const selectedOption = ref<ComboBoxOptionType | null>(null);
const isModalOpen = ref(false);
</script>
<style scoped></style>
