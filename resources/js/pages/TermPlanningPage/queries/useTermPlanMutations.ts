import { useMutation, useQueryClient } from "@tanstack/vue-query";
import type { Ref } from "vue";
import { axios } from "@/utils";
import {
  toSectionPayload,
  type SectionPayload,
} from "../helpers/sectionPayload";
import type { PlannableCourse, PlannedSection } from "../types";
import { termPlanCoursesQueryKey } from "./useTermPlanCoursesQuery";
import { termPlanQueryKey } from "./useTermPlanQuery";

/** What naming a course asks of the scheduler; the rest is derived server-side. */
export interface NewCourse {
  subject: string;
  catalogNumber: string;
  title: string;
  credits: number | null;
}

/**
 * Writes to a term plan. Each one invalidates the term's sections, so the
 * server's answer replaces whatever the page was showing rather than the two
 * being reconciled by hand.
 */
export function useTermPlanMutations(
  groupId: Readonly<Ref<number>>,
  termCode: Readonly<Ref<number | null>>,
) {
  const queryClient = useQueryClient();
  const url = () => `/api/term-planning/groups/${groupId.value}/sections`;

  const refetchTermPlan = () =>
    queryClient.invalidateQueries({
      queryKey: termPlanQueryKey(groupId, termCode),
    });

  const createSection = useMutation({
    mutationFn: async (payload: SectionPayload) => {
      const res = await axios.post<PlannedSection>(url(), payload);
      return res.data;
    },
    onSuccess: refetchTermPlan,
  });

  const saveSection = useMutation({
    mutationFn: (section: PlannedSection) =>
      axios.put(`${url()}/${section.id}`, toSectionPayload(section)),
    onSuccess: refetchTermPlan,
  });

  const deleteSection = useMutation({
    mutationFn: (sectionId: number) => axios.delete(`${url()}/${sectionId}`),
    onSuccess: refetchTermPlan,
  });

  const createCourse = useMutation({
    mutationFn: async (course: NewCourse) => {
      const res = await axios.post<PlannableCourse>(
        `/api/term-planning/groups/${groupId.value}/courses`,
        course,
      );
      return res.data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: termPlanCoursesQueryKey(groupId),
      }),
  });

  return { createSection, saveSection, deleteSection, createCourse };
}
