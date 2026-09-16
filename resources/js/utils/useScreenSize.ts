import { computed } from "vue";
import { useMediaQuery } from "@vueuse/core";

/**
 * How much room the screen has, as three named sizes rather than a pixel
 * count, so a component asks "is there room to dock a panel" instead of
 * repeating a number.
 *
 * The two breaks are where the layout actually fails, not round numbers. A
 * filters panel and a sheet together take about 700px of width; below 1200
 * there is not enough left for a week of lanes beside them, so both panels
 * become overlays. Below 700 the week grid cannot be read at all, and the day
 * list is the only view offered.
 */
export type ScreenSize = "small" | "medium" | "large";

export function useScreenSize() {
  const isLarge = useMediaQuery("(min-width: 1200px)");
  const isSmall = useMediaQuery("(max-width: 699px)");

  const size = computed<ScreenSize>(() =>
    isLarge.value ? "large" : isSmall.value ? "small" : "medium",
  );

  return {
    size,
    /**
     * Both panels sit in the layout as columns of their own. Below this they
     * are summoned instead: a panel covers what is behind it and closes again.
     */
    isLarge,
    isSmall,
  };
}
