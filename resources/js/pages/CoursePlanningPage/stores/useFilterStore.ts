import { defineStore } from 'pinia';
import { computed, reactive, toRefs } from 'vue';
import { useCourseStore } from './useCourseStore';
import { useCourseSectionStore } from './useCourseSectionStore';
import { useLeaveStore } from './useLeaveStore';


const useFiltersStore = defineStore('filters', () => {
  const state = reactive({});

  useLeaveStore().

  return {
    ...toRefs(state),
  }
});
