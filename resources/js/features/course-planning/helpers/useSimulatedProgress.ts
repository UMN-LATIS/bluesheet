import { ref } from "vue";

export function useSimulatedProgress() {
  const progress = ref(0);

  function simulateUpTo(max) {
    let incremented = 0;
    const interval = setInterval(() => {
      const inc = 0.25 * Math.min(Math.random() * 0.1, max - incremented);
      incremented += inc;
      progress.value += inc;
    }, 500);

    function complete() {
      clearInterval(interval);
      // close the difference between the simulated progress and the max
      progress.value = progress.value - incremented + max;
    }

    return complete;
  }

  return {
    progress,
    simulateUpTo,
  };
}
