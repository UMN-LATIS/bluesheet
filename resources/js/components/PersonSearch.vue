<template>
  <div class="person-search">
    <input
      v-model="query"
      :class="inputClass"
      class="person-search__input form-control"
      @input="handleInput"
    />

    <div class="person-search__results">
      <div v-if="!users.length" class="person-search__no-items">
        <span v-if="isFetching">Searching...</span>
        <span v-else-if="query.length < 3"> Enter at least 3 characters </span>
        <span v-else>No results found</span>
      </div>

      <button
        v-for="user in users"
        :key="user.umndid"
        class="person-search__item"
        @click="$emit('selected', user)"
      >
        <span class="person-search__name">{{ user.full_name }}</span>
        <span class="person-search__id">({{ user.uid }})</span>
      </button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";
import { UserLookupItem, CSSClass } from "@/types";
import pDebounce from "p-debounce";
import { lookupUsers } from "@/api";

defineProps<{
  inputClass?: CSSClass;
}>();

defineEmits<{
  (eventName: "selected", user: UserLookupItem);
}>();

const query = ref("");
const users = ref<UserLookupItem[]>([]);
const isFetching = ref(false);

const debouncedLookupUsers = pDebounce(lookupUsers, 500);

async function handleInput(event: Event) {
  query.value = (event.target as HTMLInputElement).value;

  if (query.value.length < 3) {
    users.value = [];
    return;
  }

  isFetching.value = true;
  users.value = await debouncedLookupUsers(query.value);
  isFetching.value = false;
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
