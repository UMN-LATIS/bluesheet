import { useMutation, useQueryClient } from "@tanstack/vue-query";
import type { Ref } from "vue";
import { saveGradPerson, savePersonInput, savePersonRateOverride } from "@/api";
import type {
  GradPersonEdit,
  PersonSalaryEdit,
} from "../helpers/costOverrides";
import type { PersonInputEdit } from "../helpers/personInputs";

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

  const savePersonSalaryEdit = useMutation({
    mutationFn: ({ emplid, amount }: PersonSalaryEdit) =>
      savePersonRateOverride(
        groupId.value,
        termCode.value ?? 0,
        emplid,
        amount,
      ),
    onSuccess: refetchAssumptions,
  });

  const saveGradPersonEdit = useMutation({
    mutationFn: (edit: GradPersonEdit) =>
      saveGradPerson(groupId.value, termCode.value ?? 0, edit),
    onSuccess: refetchAssumptions,
  });

  const savePersonInputEdit = useMutation({
    mutationFn: ({ emplid, field, value }: PersonInputEdit) =>
      savePersonInput(groupId.value, termCode.value ?? 0, emplid, {
        [field]: value,
      }),
    onSuccess: refetchAssumptions,
  });

  return { savePersonSalaryEdit, saveGradPersonEdit, savePersonInputEdit };
}
