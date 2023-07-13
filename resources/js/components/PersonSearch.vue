<template>
  <div class="person-search">
    <input
      v-bind="$attrs"
      :value="modelValue"
      :class="inputClass"
      class="person-search__input form-control"
      @input="handleInput"
    />

    <div class="person-search__results">
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
        @click="$emit('selected', user)"
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
  max-height: 10rem;
  overflow-y: auto;
  z-index: 10;
  background: white;
  margin-top: 0.25rem;
  box-shadow:
    0 1px 3px 0 rgb(0 0 0 / 0.1),
    0 1px 2px -1px rgb(0 0 0 / 0.1);
  flex-direction: column;
  display: flex;
}

.person-search:not(:focus-within) .person-search__results {
  display: none;
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
