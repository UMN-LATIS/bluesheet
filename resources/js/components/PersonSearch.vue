<template>
  <div ref="personSearchContainer" class="person-search">
    <input
      name="safari-autofill-fix"
      v-bind="$attrs"
      :value="modelValue"
      :class="inputClass"
      class="person-search__input form-control"
      autocorrect="off"
      autocomplete="off"
      @input="handleInput"
      @focus="isMenuOpen = true"
    />

    <div
      class="person-search__results"
      :class="{ 'person-search__results--is-open': isMenuOpen }"
    >
      <div v-if="!users.length" class="person-search__no-items">
        <span v-if="isFetching">Searching...</span>
        <span v-else-if="modelValue.length < 3">
          Enter at least 3 characters
        </span>
        <span v-else>No results found</span>
      </div>

      <button
        v-for="user in users"
        :key="user.umndid"
        class="person-search__item"
        type="button"
        @click="handleSelect(user)"
      >
        <span class="person-search__name">{{ user.full_name }}</span>
        <span class="person-search__id">({{ user.uid }})</span>
      </button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, watch } from "vue";
import { UserLookupItem, CSSClass } from "@/types";
import pDebounce from "p-debounce";
import { lookupUsers } from "@/api";
import { onClickOutside } from "@vueuse/core";

const props = defineProps<{
  modelValue: string;
  inputClass?: CSSClass;
}>();

const emit = defineEmits<{
  (eventName: "update:modelValue", value: string);
  (eventName: "selected", user: UserLookupItem);
}>();

const users = ref<UserLookupItem[]>([]);
const isFetching = ref(false);
const isMenuOpen = ref(false);
const personSearchContainer = ref<HTMLElement | null>(null);

onClickOutside(personSearchContainer, () => {
  isMenuOpen.value = false;
});

const debouncedLookupUsers = pDebounce(lookupUsers, 500);

watch(
  () => props.modelValue,
  async (query) => {
    if (query.length < 3) {
      users.value = [];
      return;
    }

    isFetching.value = true;
    users.value = await debouncedLookupUsers(query);
    isFetching.value = false;
  },
);

function handleInput(event: Event) {
  const query = (event.target as HTMLInputElement).value;
  emit("update:modelValue", query);
}

function handleSelect(user: UserLookupItem) {
  isMenuOpen.value = false;
  emit("update:modelValue", user.full_name);
  emit("selected", user);
}
</script>
<style scoped>
.person-search {
  position: relative;
}
.person-search__input {
  width: 100%;
}

.person-search__no-items {
  padding: 0.5rem;
  text-align: center;
  color: #999;
  font-size: 0.875rem;
}

.person-search__results {
  border: 1px solid #ccc;
  border-radius: 0.25rem;
  position: absolute;
  top: 100%;
  width: 100%;
  overflow-y: auto;
  z-index: 10;
  background: white;
  margin-top: 0.25rem;
  box-shadow:
    0 1px 3px 0 rgb(0 0 0 / 0.1),
    0 1px 2px -1px rgb(0 0 0 / 0.1);
  flex-direction: column;
}

.person-search__results {
  display: none;
}
.person-search__results.person-search__results--is-open {
  display: flex;
}

.person-search__list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.person-search__item {
  background: transparent;
  padding: 0.5rem;
  border: 0;
  border-bottom: 1px solid #ccc;
  display: flex;
  text-align: left;
  justify-content: space-between;
}

.person-search__item:is(:hover, :focus) {
  background: #f5f5f5;
  cursor: pointer;
}

.person-search__name {
  flex: 1;
}
.person-search__id {
  color: #999;
  font-size: 0.875rem;
}
</style>
