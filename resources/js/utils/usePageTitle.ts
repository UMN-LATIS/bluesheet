import { useTitle } from "@vueuse/core";

export function usePageTitle(title: string) {
  return useTitle(title, {
    titleTemplate: "BlueSheet | %s",
  });
}
