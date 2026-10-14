import { useMutation, useQueryClient } from "@tanstack/vue-query";
import type { Ref } from "vue";
import {
  saveGradHoursOverride,
  saveGradInputOverride,
  saveGradPerson,
  saveJobCodeRateOverride,
  savePersonNote,
  savePersonRateOverride,
} from "@/api";
import type {
  GradHoursEdit,
  GradInputEdit,
  GradPersonEdit,
  RateOverrideEdit,
} from "../helpers/costOverrides";
import type { PersonNoteEdit } from "../helpers/personNotes";

export function useCostMutations(
  groupId: Readonly<Ref<number>>,
  termCode: Readonly<Ref<number | null>>,
) {
  const queryClient = useQueryClient();
  // Return the promise: without it the autosave drops the
  // edit before the refetch ends and the old value shows.
  const refetchAssumptions = () =>
    queryClient.invalidateQueries({
      queryKey: ["termPlan", "costAssumptions"],
    });

  const saveRateOverride = useMutation({
    mutationFn: ({ rate, amount }: RateOverrideEdit) => {
      const term = termCode.value ?? 0;
      switch (rate.kind) {
        case "jobCode":
          return saveJobCodeRateOverride(groupId.value, term, rate.jobCode, {
            [rate.field]: amount,
          } as { salary: number | null } | { fringeRate: number | null });
        case "person":
          return savePersonRateOverride(
            groupId.value,
            term,
            rate.emplid,
            amount,
          );
      }
    },
    onSuccess: refetchAssumptions,
  });

  const saveGradInputEdit = useMutation({
    mutationFn: ({ field, value }: GradInputEdit) =>
      saveGradInputOverride(groupId.value, termCode.value ?? 0, field, value),
    onSuccess: refetchAssumptions,
  });

  const saveGradHoursEdit = useMutation({
    mutationFn: ({ appointmentPercent, hours }: GradHoursEdit) =>
      saveGradHoursOverride(
        groupId.value,
        termCode.value ?? 0,
        appointmentPercent,
        hours,
      ),
    onSuccess: refetchAssumptions,
  });

  const saveGradPersonEdit = useMutation({
    mutationFn: (edit: GradPersonEdit) =>
      saveGradPerson(groupId.value, termCode.value ?? 0, edit),
    onSuccess: refetchAssumptions,
  });

  const savePersonNoteEdit = useMutation({
    mutationFn: ({ emplid, notes }: PersonNoteEdit) =>
      savePersonNote(groupId.value, termCode.value ?? 0, emplid, notes),
    onSuccess: refetchAssumptions,
  });

  return {
    saveRateOverride,
    saveGradInputEdit,
    saveGradHoursEdit,
    saveGradPersonEdit,
    savePersonNoteEdit,
  };
}
