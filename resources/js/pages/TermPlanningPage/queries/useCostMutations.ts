import { useMutation, useQueryClient } from "@tanstack/vue-query";
import type { Ref } from "vue";
import { saveGradPerson, savePersonInput, saveSectionPayOverride } from "@/api";
import type { GradPerson } from "@/types";
import type { PersonInputEdit } from "../helpers/personInputs";
import type { SectionPayEdit } from "../helpers/sectionPayOverrides";
import { costAssumptionsQueryKey } from "./useCostAssumptionsQuery";

export function useCostMutations(
  groupId: Readonly<Ref<number>>,
  termCode: Readonly<Ref<number | null>>,
) {
  const queryClient = useQueryClient();
  // Return the promise: without it the autosave drops the
  // edit before the refetch ends and the old value shows.
  const refetchAssumptions = () =>
    queryClient.invalidateQueries({
      queryKey: costAssumptionsQueryKey(groupId, termCode),
    });

  const saveGradPersonEdit = useMutation({
    mutationFn: (edit: GradPerson) =>
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

  const saveSectionPayEdit = useMutation({
    mutationFn: ({ field, value, ...sectionPerson }: SectionPayEdit) =>
      saveSectionPayOverride(groupId.value, termCode.value ?? 0, {
        ...sectionPerson,
        [field]: value,
      }),
    onSuccess: refetchAssumptions,
  });

  return { saveGradPersonEdit, savePersonInputEdit, saveSectionPayEdit };
}
