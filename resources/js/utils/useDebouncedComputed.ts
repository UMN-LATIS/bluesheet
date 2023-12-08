import { ref, Ref, watch } from "vue";

export function useDebouncedComputed<T>(
  computeFn: () => T,
  deps: Ref<unknown>[] | Ref<unknown>,
  delay = 0,
): Ref<T> {
  const debouncedValue = ref(computeFn()) as Ref<T>;
  let debounceTimeout: number | undefined;

  watch(
    deps,
    () => {
      if (debounceTimeout) clearTimeout(debounceTimeout);

      debounceTimeout = setTimeout(() => {
        debouncedValue.value = computeFn();
      }, delay);
    },
    { immediate: true },
  );

  return debouncedValue;
}
