import { useMutation, useQueryClient } from "@tanstack/vue-query";
import type { Ref } from "vue";
import {
  addArtifactToLeave,
  createLeaveInGroup,
  removeArtifactFromLeave,
  removeLeave,
  saveArtifactEdits,
  saveLeaveEdits,
  type ArtifactPayload,
  type NewLeavePayload,
  type SavedLeavePayload,
} from "@/api/leavePlanningApi";
import { leaveArtifactsQueryKey } from "./useLeaveArtifactsQuery";

export function useLeaveMutations(groupId: Readonly<Ref<number>>) {
  const queryClient = useQueryClient();

  const refetchTimeline = () =>
    queryClient.invalidateQueries({
      queryKey: ["leavePlanning", "leaves", groupId.value],
    });

  const refetchArtifacts = (leaveId: number) =>
    queryClient.invalidateQueries({
      queryKey: leaveArtifactsQueryKey(leaveId),
    });

  const createLeave = useMutation({
    mutationFn: (payload: NewLeavePayload) =>
      createLeaveInGroup(groupId.value, payload),
    onSuccess: refetchTimeline,
  });

  const saveLeave = useMutation({
    mutationFn: ({
      leaveId,
      payload,
    }: {
      leaveId: number;
      payload: SavedLeavePayload;
    }) => saveLeaveEdits(leaveId, payload),
    onSuccess: refetchTimeline,
  });

  const deleteLeave = useMutation({
    mutationFn: (leaveId: number) => removeLeave(leaveId),
    onSuccess: refetchTimeline,
  });

  const createArtifact = useMutation({
    mutationFn: ({
      leaveId,
      payload,
    }: {
      leaveId: number;
      payload: ArtifactPayload;
    }) => addArtifactToLeave(leaveId, payload),
    onSuccess: (_result, { leaveId }) => refetchArtifacts(leaveId),
  });

  const saveArtifact = useMutation({
    mutationFn: ({
      leaveId,
      artifactId,
      payload,
    }: {
      leaveId: number;
      artifactId: number;
      payload: ArtifactPayload;
    }) => saveArtifactEdits(leaveId, artifactId, payload),
    onSuccess: (_result, { leaveId }) => refetchArtifacts(leaveId),
  });

  const deleteArtifact = useMutation({
    mutationFn: ({
      leaveId,
      artifactId,
    }: {
      leaveId: number;
      artifactId: number;
    }) => removeArtifactFromLeave(leaveId, artifactId),
    onSuccess: (_result, { leaveId }) => refetchArtifacts(leaveId),
  });

  return {
    createLeave,
    saveLeave,
    deleteLeave,
    createArtifact,
    saveArtifact,
    deleteArtifact,
  };
}
