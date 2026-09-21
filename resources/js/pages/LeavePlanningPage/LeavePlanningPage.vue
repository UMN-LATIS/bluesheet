<template>
  <FullScreenLayout
    :backRoute="{ name: 'group', params: { groupId } }"
    backLabel="Back to group"
  >
    <template #bar>
      <LeavePlanningToolbar
        :groupId="groupId"
        :canCreateLeaves="canCreateLeaves"
        :isHistoryShown="planning.isHistoryShown"
        :view="planning.view"
        @createLeave="startCreatingWithoutPerson"
        @selectView="planning.selectView"
      />
    </template>

    <div
      class="tw-relative tw-flex tw-min-h-0 tw-flex-1 tw-gap-3 tw-px-3 tw-pb-3 roomy:tw-px-4 roomy:tw-pb-4"
    >
      <FilterDock
        :appliedFilters="planning.appliedFilters"
        :isOpen="isFilterPanelOpen"
        :isDocked="isLarge"
        :isSmall="isSmall"
        :activeFilterCount="planning.activeFilterCount"
        @toggle="isFilterPanelOpen = !isFilterPanelOpen"
      >
        <PlanningSidebar :planning="planning" />
      </FilterDock>

      <Pane
        as="section"
        aria-label="Leave timeline"
        class="tw-flex tw-min-h-0 tw-min-w-0 tw-flex-1 tw-flex-col"
      >
        <p
          v-if="unavailableMessage"
          class="tw-m-auto tw-px-6 tw-text-center tw-text-[13px] tw-text-on-surface-variant"
        >
          {{ unavailableMessage }}
        </p>

        <TimelineHeaderBar
          v-if="!unavailableMessage"
          :terms="terms"
          :range="planning.timelineRange"
          :canViewCourses="canViewCourses"
          :isHistoryShown="planning.isHistoryShown"
          @selectRangeStart="planning.selectRangeStart"
          @selectRangeEnd="planning.selectRangeEnd"
          @toggleHistory="planning.toggleHistory"
        />

        <TimelineCanvas
          v-if="!unavailableMessage && planning.axis"
          :axis="planning.axis"
          :nameHeading="nameHeading"
          :isHistoryShown="planning.isHistoryShown"
          :groupId="groupId"
          :canViewTermPlanning="canViewCourses"
          :plannedTermCodes="planning.plannedTermCodes"
          :plannableTermCodes="planning.plannableTermCodes"
          :trailingScrollRoomPx="trailingScrollRoomPx"
          :today="today"
          :selectionKey="selectionKey"
        >
          <LeaveRows
            v-if="!planning.isHistoryShown"
            :rows="planning.leaveRows"
            :axis="planning.axis"
            :selectedLeaveId="selectedLeaveId"
            :emptyMessage="emptyMessage"
            :canCreateLeaves="canCreateLeaves"
            @selectLeave="planning.selectLeave"
            @createLeave="startCreatingAt"
          />
          <CourseHistoryRows
            v-else-if="planning.view === 'courses'"
            :courseHistory="planning.courseHistory"
            :axis="planning.axis"
            :peopleByEmplid="planning.peopleByEmplid"
            :selectedLeaveId="selectedLeaveId"
            :selectedSectionKey="selectedSectionKey"
            :emptyMessage="emptyMessage"
            @selectLeave="planning.selectLeave"
            @selectSection="planning.selectSection"
          />
          <PersonHistoryRows
            v-else
            :rows="planning.personHistoryRows"
            :axis="planning.axis"
            :selectedLeaveId="selectedLeaveId"
            :selectedSectionKey="selectedSectionKey"
            :emptyMessage="emptyMessage"
            @selectLeave="planning.selectLeave"
            @selectSection="planning.selectSection"
          />
        </TimelineCanvas>
      </Pane>

      <PanelMount v-if="isPanelOpen" :panelWidthPx="panelWidthPx">
        <LeavePanel
          v-if="planning.selectedLeave || planning.draft"
          :leave="planning.selectedLeave"
          :person="panelPerson"
          :otherLeaves="otherLeavesOfSelectedLeave"
          :terms="
            planning.selectedLeave
              ? termsOverlapping(terms, planning.selectedLeave)
              : []
          "
          :groupId="groupId"
          :canViewTermPlanning="canViewCourses"
          :draft="planning.draft"
          :isEditable="isSelectedLeaveEditable"
          :isDraftValid="planning.isDraftValid"
          :isSaving="isSaving"
          :refusal="refusal"
          :artifacts="artifactsQuery.data.value ?? []"
          :roster="rosterQuery.data.value ?? []"
          :payrollDates="payrollDatesQuery.data.value ?? []"
          @close="planning.deselect"
          @selectLeave="planning.selectLeave"
          @requestEdit="startEditing"
          @edit="planning.editDraft"
          @save="saveDraft"
          @cancel="planning.cancelDraft"
          @delete="deleteSelectedLeave"
          @createArtifact="createArtifact"
          @saveArtifact="saveArtifact"
          @deleteArtifact="deleteArtifact"
        />
        <SectionPanel
          v-else-if="planning.selectedSection"
          :section="planning.selectedSection"
          :termName="termNameOf(planning.selectedSection.termCode)"
          :groupId="groupId"
          :peopleByEmplid="planning.peopleByEmplid"
          @close="planning.deselect"
        />
      </PanelMount>

      <div
        v-if="planning.pendingDismissal"
        class="tw-absolute tw-inset-0 tw-z-[60] tw-flex tw-items-center tw-justify-center tw-bg-black/20"
      >
        <div
          role="alertdialog"
          aria-label="Unsaved leave"
          class="tw-w-[320px] tw-rounded-xl tw-bg-surface-bright tw-p-4 tw-shadow-lg"
        >
          <p class="tw-m-0 tw-mb-3 tw-text-[13.5px]">
            This leave has changes you haven’t saved. Leaving now discards them.
          </p>
          <div class="tw-flex tw-justify-end tw-gap-2">
            <Button variant="secondary" @click="planning.cancelDismissal">
              Keep editing
            </Button>
            <Button variant="danger" @click="planning.confirmDismissal">
              Discard
            </Button>
          </div>
        </div>
      </div>
    </div>
  </FullScreenLayout>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { onKeyStroke } from "@vueuse/core";
import { useRoute, useRouter } from "vue-router";
import { omit } from "lodash-es";
import dayjs from "dayjs";
import type { LeaveStatus, LeaveType, PlanningLeave } from "@/types";
import FullScreenLayout from "@/layouts/FullScreenLayout.vue";
import Pane from "@/components/planning/Pane.vue";
import { flattenQuery } from "@/utils/urlQuery";
import { termsOverlapping } from "@/utils/termsOverlapping";
import { useScreenSize } from "@/utils/useScreenSize";
import LeavePlanningToolbar from "./components/LeavePlanningToolbar.vue";
import FilterDock from "@/components/planning/FilterDock.vue";
import PlanningSidebar from "./components/PlanningSidebar.vue";
import TimelineHeaderBar from "./components/TimelineHeaderBar.vue";
import TimelineCanvas from "./components/TimelineCanvas.vue";
import LeaveRows from "./components/LeaveRows.vue";
import PersonHistoryRows from "./components/PersonHistoryRows.vue";
import CourseHistoryRows from "./components/CourseHistoryRows.vue";
import PanelMount from "./components/PanelMount.vue";
import LeavePanel from "@/components/planning/LeavePanel.vue";
import Button from "@/components/Button.vue";
import SectionPanel from "./components/SectionPanel.vue";
import { useLeaveTimelineQuery } from "./queries/useLeaveTimelineQuery";
import { useLeaveArtifactsQuery } from "./queries/useLeaveArtifactsQuery";
import { useLeaveMutations } from "./queries/useLeaveMutations";
import { useLeavePermissionsQuery } from "./queries/useLeavePermissionsQuery";
import { useLeavePermissionsForGroupQuery } from "./queries/useLeavePermissionsForGroupQuery";
import { useSisEmployeesQuery } from "@/queries/useSisEmployeesQuery";
import { useTermPayrollDatesQuery } from "./queries/useTermPayrollDatesQuery";
import { newLeaveDatesAt } from "./helpers/newLeaveDates";
import { refusalMessage } from "@/utils/refusalMessage";
import type { ArtifactPayload } from "@/api/leavePlanningApi";
import { useTeachingHistoryQuery } from "./queries/useTeachingHistoryQuery";
import { useSisTermsQuery } from "./queries/useSisTermsQuery";
import { useCoursePermissionsQuery } from "./queries/useCoursePermissionsQuery";
import { useLeavePlanningView } from "./useLeavePlanningView/useLeavePlanningView";
import { OWNED_QUERY_KEYS } from "./useLeavePlanningView/viewQuery";
import type { Effect, TeachingView } from "./useLeavePlanningView/types";

const PANEL_WIDTH = { medium: 380, large: 404 } as const;
const PANEL_CLEARANCE = 24;

const props = defineProps<{ groupId: number }>();

const route = useRoute();
const router = useRouter();
const { isLarge, isSmall } = useScreenSize();

const groupId = computed(() => props.groupId);
const today = computed(() => dayjs().format("YYYY-MM-DD"));
const isFilterPanelOpen = ref(isLarge.value);

watch(isLarge, (isWide) => (isFilterPanelOpen.value = isWide));

const runEffect = (effect: Effect) => {
  switch (effect.type) {
    case "replaceUrlQuery":
      router.replace({
        query: { ...omit(route.query, OWNED_QUERY_KEYS), ...effect.query },
      });
  }
};

const termsQuery = useSisTermsQuery();
const terms = computed(() => termsQuery.data.value ?? []);

const coursePermissionsQuery = useCoursePermissionsQuery(groupId);
const canViewCourses = computed(
  () => coursePermissionsQuery.data.value?.viewAny ?? false,
);
const canPlanTerms = computed(
  () => coursePermissionsQuery.data.value?.create ?? false,
);

// A useLeaveTimelineQuery/useTeachingHistoryQuery argument
// that reads a `planning` field built from `timelineQuery`
// or `teachingHistoryQuery` data throws a ReferenceError:
// useQuery reads its key now, before those queries below
// are declared.
const planning = useLeavePlanningView(
  computed(() => ({
    timeline: timelineQuery.data.value ?? null,
    teachingHistory: teachingHistoryQuery.data.value ?? null,
    terms: terms.value,
    canViewCourses: canViewCourses.value,
    canPlanTerms: canPlanTerms.value,
  })),
  runEffect,
);

watch(
  () => route.query,
  (query) => planning.urlChanged(flattenQuery(query)),
  { immediate: true },
);

const timelineQuery = useLeaveTimelineQuery(
  groupId,
  computed(() => planning.requestedRange.startTermCode),
  computed(() => planning.requestedRange.endTermCode),
);

const teachingHistoryQuery = useTeachingHistoryQuery(
  groupId,
  computed(() => timelineQuery.data.value?.range ?? null),
  computed(() => planning.isHistoryRequested && canViewCourses.value),
);

onKeyStroke("Escape", () => {
  if (planning.pendingDismissal) {
    planning.cancelDismissal();
    return;
  }
  if (isFilterPanelOpen.value && !isLarge.value) {
    isFilterPanelOpen.value = false;
    return;
  }
  if (planning.draft) {
    planning.cancelDraft();
    return;
  }
  planning.deselect();
});

const unavailableMessage = computed(() => {
  if (timelineQuery.isPending.value) return "Loading leaves…";
  if (timelineQuery.isError.value) return "Leaves could not be loaded.";
  if (timelineQuery.data.value === null) {
    return "You don’t have permission to view leaves for this department.";
  }
  if (planning.timelineRange === null) {
    return "This group isn’t linked to a department in the SIS.";
  }
  if (termsQuery.isPending.value) return "Loading terms…";
  if (termsQuery.isError.value) return "Terms could not be loaded.";
  if (!planning.axis) return "This range names a term with no dates.";
  if (planning.isHistoryShown && teachingHistoryQuery.isPending.value) {
    return "Loading teaching history…";
  }
  if (planning.isHistoryShown && teachingHistoryQuery.isError.value) {
    return "Teaching history could not be loaded.";
  }
  return null;
});

const VIEW_HEADINGS: Record<TeachingView, string> = {
  instructors: "Instructors",
  tas: "Teaching assistants",
  courses: "Courses",
};

const nameHeading = computed(() => {
  const { shown } = planning.rowCounts;
  if (!planning.isHistoryShown) return `On leave · ${shown}`;
  return `${VIEW_HEADINGS[planning.view]} · ${shown}`;
});

const emptyMessage = computed(() => {
  if (planning.activeFilterCount > 0)
    return "Nothing here matches the filters.";
  if (planning.isHistoryShown) return "No teaching in this range.";
  return "No leaves in this range.";
});

const selectedLeaveId = computed(() =>
  planning.selection?.kind === "leave" ? planning.selection.leaveId : null,
);
const selectedSectionKey = computed(() =>
  planning.selection?.kind === "section" ? planning.selection.sectionKey : null,
);
const selectionKey = computed(() => {
  if (selectedLeaveId.value !== null) return `leave-${selectedLeaveId.value}`;
  if (selectedSectionKey.value !== null) {
    return `section-${selectedSectionKey.value}`;
  }
  return null;
});

const isPanelOpen = computed(
  () =>
    planning.selectedLeave !== null ||
    planning.selectedSection !== null ||
    planning.draft !== null,
);

const openLeaveId = computed(() => planning.openLeaveId);

const artifactsQuery = useLeaveArtifactsQuery(openLeaveId);
const leavePermissionsQuery = useLeavePermissionsQuery(openLeaveId);
const groupLeavePermissionsQuery = useLeavePermissionsForGroupQuery(groupId);
const payrollDatesQuery = useTermPayrollDatesQuery();

const canCreateLeaves = computed(
  () => groupLeavePermissionsQuery.data.value?.create ?? false,
);

const rosterQuery = useSisEmployeesQuery(groupId, canCreateLeaves);

const mutations = useLeaveMutations(groupId);

const panelPerson = computed(() => {
  const leaveEmplid = planning.selectedLeave?.emplid ?? null;
  const emplid = leaveEmplid ?? planning.draft?.emplid ?? null;
  if (emplid === null) return undefined;
  return planning.peopleByEmplid.get(emplid);
});

const isSelectedLeaveEditable = computed(
  () => leavePermissionsQuery.data.value?.update ?? false,
);

const isSaving = computed(
  () =>
    mutations.createLeave.isPending.value ||
    mutations.saveLeave.isPending.value ||
    mutations.deleteLeave.isPending.value,
);

const refusal = ref<string | null>(null);

watch(
  () => [openLeaveId.value, planning.draft],
  () => (refusal.value = null),
);

function startCreatingAt(emplid: number, fraction: number) {
  const axis = planning.axis;
  if (!axis) return;

  const range = newLeaveDatesAt(
    axis,
    payrollDatesQuery.data.value ?? [],
    fraction,
  );
  if (!range) return;

  refusal.value = null;
  planning.requestCreation(emplid, range.startDate, range.endDate);
}

function startCreatingWithoutPerson() {
  const axis = planning.axis;
  const range = axis
    ? newLeaveDatesAt(axis, payrollDatesQuery.data.value ?? [], 0.5)
    : null;

  refusal.value = null;
  planning.requestCreation(
    null,
    range?.startDate ?? today.value,
    range?.endDate ?? today.value,
  );
}

const startEditing = () => {
  const leave = planning.selectedLeave;
  if (!leave) return;
  refusal.value = null;
  planning.requestEdit({
    emplid: leave.emplid,
    description: leave.description,
    type: leave.type,
    status: leave.status,
    startDate: leave.startDate,
    endDate: leave.endDate,
  });
};

const REFUSED =
  "That change could not be saved. Check your connection and try again.";

type LeaveWrite = {
  description: string;
  start_date: string;
  end_date: string;
  status: LeaveStatus;
  type: LeaveType;
};

async function saveDraft() {
  const draft = planning.draft;
  if (!draft) return;
  refusal.value = null;

  const fields = {
    description: draft.description,
    start_date: draft.startDate,
    end_date: draft.endDate,
    status: draft.status,
    type: draft.type,
  };

  const editedLeaveId =
    planning.selection?.kind === "leave" ? planning.selection.leaveId : null;

  try {
    if (editedLeaveId === null) {
      await createLeaveFromDraft(draft.emplid, fields);
      return;
    }
    await saveLeaveEdits(editedLeaveId, fields);
  } catch (error) {
    refusal.value = refusalMessage(error) ?? REFUSED;
  }
}

async function createLeaveFromDraft(emplid: number | null, fields: LeaveWrite) {
  if (emplid === null) return;
  const created = await mutations.createLeave.mutateAsync({
    ...fields,
    emplid,
  });
  planning.markLeavePersisted(created.id);
}

async function saveLeaveEdits(leaveId: number, fields: LeaveWrite) {
  const userId = planning.selectedLeave?.userId;
  if (userId === undefined) return;

  await mutations.saveLeave.mutateAsync({
    leaveId,
    payload: { ...fields, user_id: userId },
  });
  planning.markLeavePersisted(leaveId);
}

async function deleteSelectedLeave() {
  const leaveId = planning.selectedLeave?.id;
  if (leaveId === undefined) return;
  refusal.value = null;

  try {
    await mutations.deleteLeave.mutateAsync(leaveId);
    planning.markLeaveDeleted();
  } catch (error) {
    refusal.value = refusalMessage(error) ?? REFUSED;
  }
}

const writeToOpenLeave = async (
  write: (leaveId: number) => Promise<unknown>,
) => {
  const leaveId = openLeaveId.value;
  if (leaveId === null) return;
  refusal.value = null;

  try {
    await write(leaveId);
  } catch (error) {
    refusal.value = refusalMessage(error) ?? REFUSED;
  }
};

const createArtifact = (payload: ArtifactPayload) =>
  writeToOpenLeave((leaveId) =>
    mutations.createArtifact.mutateAsync({ leaveId, payload }),
  );

const saveArtifact = (artifactId: number, payload: ArtifactPayload) =>
  writeToOpenLeave((leaveId) =>
    mutations.saveArtifact.mutateAsync({ leaveId, artifactId, payload }),
  );

const deleteArtifact = (artifactId: number) =>
  writeToOpenLeave((leaveId) =>
    mutations.deleteArtifact.mutateAsync({ leaveId, artifactId }),
  );

const panelWidthPx = computed(() =>
  isLarge.value ? PANEL_WIDTH.large : PANEL_WIDTH.medium,
);

const trailingScrollRoomPx = computed(() => {
  if (!isPanelOpen.value || isSmall.value) return 0;
  return panelWidthPx.value + PANEL_CLEARANCE;
});

const otherLeavesOfSelectedLeave = computed(() => {
  const selectedLeave = planning.selectedLeave;
  if (!selectedLeave) return [];
  const isOtherLeaveOfSamePerson = (leave: PlanningLeave) =>
    leave.emplid === selectedLeave.emplid && leave.id !== selectedLeave.id;
  return (timelineQuery.data.value?.leaves ?? []).filter(
    isOtherLeaveOfSamePerson,
  );
});

const termNameOf = (termCode: number) =>
  terms.value.find((term) => term.termCode === termCode)?.name ??
  String(termCode);
</script>
