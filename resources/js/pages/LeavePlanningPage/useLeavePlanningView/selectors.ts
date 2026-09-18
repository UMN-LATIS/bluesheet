import type {
  PlanningLeave,
  PlanningPerson,
  PlanningTermRange,
  TeachingSection,
} from "@/types";
import { axisFor, type TimelineAxis } from "../helpers/timelineAxis";
import {
  courseHistoryOf,
  leaveRowsOf,
  personHistoryRowsOf,
  sectionsOf,
  type CourseHistory,
  type LeaveRow,
  type PersonHistoryRow,
} from "../helpers/planningRows";
import {
  filterOptionsFor,
  type FilterOption,
  type VisibleRecords,
} from "../helpers/filterOptions";
import {
  FILTER_FACETS,
  HISTORY_FACETS,
  type FilterFacet,
  type PlanningFilters,
  type ViewContext,
  type ViewState,
} from "./types";
import { emptyFilters } from "./viewQuery";

export interface FacetTileSummary {
  facet: FilterFacet;
  reachableCount: number;
  totalCount: number;
  checkedCount: number;
}

interface RowCounts {
  shown: number;
  total: number;
  noun: "person" | "course";
}

export const selectIsHistoryShown = (context: ViewContext, state: ViewState) =>
  state.isHistoryRequested && context.canViewCourses;

export const selectVisibleFacets = (
  context: ViewContext,
  state: ViewState,
): FilterFacet[] => {
  if (selectIsHistoryShown(context, state)) return [...FILTER_FACETS];
  return FILTER_FACETS.filter((facet) => !HISTORY_FACETS.includes(facet));
};

export const selectActiveFacet = (
  context: ViewContext,
  state: ViewState,
): FilterFacet => {
  const isVisible = selectVisibleFacets(context, state).includes(
    state.activeFacet,
  );
  return isVisible ? state.activeFacet : "person";
};

export const selectTimelineRange = (
  context: ViewContext,
): PlanningTermRange | null => context.timeline?.range ?? null;

export const selectAxis = (context: ViewContext): TimelineAxis | null => {
  const range = selectTimelineRange(context);
  if (!range) return null;
  return axisFor(context.terms, range);
};

export const selectLeaveRows = (
  context: ViewContext,
  filters: PlanningFilters,
): LeaveRow[] => {
  if (!context.timeline) return [];
  return leaveRowsOf(context.timeline, filters);
};

export const selectPersonHistoryRows = (
  context: ViewContext,
  state: ViewState,
  filters: PlanningFilters,
): PersonHistoryRow[] => {
  if (!context.teachingHistory || state.view === "courses") return [];
  const leaves = context.timeline?.leaves ?? [];
  return personHistoryRowsOf(
    context.teachingHistory,
    leaves,
    state.view,
    filters,
  );
};

export const selectCourseHistory = (
  context: ViewContext,
  filters: PlanningFilters,
): CourseHistory => {
  if (!context.teachingHistory) return { peopleOnLeave: [], courses: [] };
  return courseHistoryOf(context.teachingHistory, context.timeline, filters);
};

export function selectRowCounts(
  context: ViewContext,
  state: ViewState,
): RowCounts {
  if (!selectIsHistoryShown(context, state)) {
    return {
      shown: selectLeaveRows(context, state.filters).length,
      total: selectLeaveRows(context, emptyFilters()).length,
      noun: "person",
    };
  }

  if (state.view === "courses") {
    return {
      shown: selectCourseHistory(context, state.filters).courses.length,
      total: selectCourseHistory(context, emptyFilters()).courses.length,
      noun: "course",
    };
  }

  return {
    shown: selectPersonHistoryRows(context, state, state.filters).length,
    total: selectPersonHistoryRows(context, state, emptyFilters()).length,
    noun: "person",
  };
}

export const selectPlannedTermIds = (context: ViewContext): Set<number> => {
  const sections = context.teachingHistory?.sections ?? [];
  const plannedSections = sections.filter(({ isPlanned }) => isPlanned);
  return new Set(plannedSections.map(({ termId }) => termId));
};

export const selectPlannableTermIds = (
  context: ViewContext,
  state: ViewState,
): Set<number> => {
  const { teachingHistory, canPlanTerms } = context;
  const isHistoryShown = selectIsHistoryShown(context, state);
  if (!isHistoryShown || !canPlanTerms || !teachingHistory) return new Set();

  const readOnlyTermIds = new Set(teachingHistory.readOnlyTermIds);
  const termIds = (selectAxis(context)?.terms ?? []).map(({ term }) => term.id);
  return new Set(termIds.filter((termId) => !readOnlyTermIds.has(termId)));
};

export const selectPeopleByEmplid = (
  context: ViewContext,
): Map<number, PlanningPerson> => {
  const people = [
    ...(context.timeline?.people ?? []),
    ...(context.teachingHistory?.people ?? []),
  ];
  return new Map(people.map((person) => [person.emplid, person]));
};

function uniqueSections(sections: TeachingSection[]): TeachingSection[] {
  const sectionsByKey = new Map(
    sections.map((section) => [section.key, section]),
  );
  return [...sectionsByKey.values()];
}

function visibleRecordsOf(
  context: ViewContext,
  state: ViewState,
  filters: PlanningFilters,
): VisibleRecords {
  if (!selectIsHistoryShown(context, state) || !context.teachingHistory) {
    const rows = selectLeaveRows(context, filters);
    return {
      people: rows.map(({ person }) => person),
      leaves: rows.flatMap(({ leaves }) => leaves),
      sections: [],
      isHistoryShown: false,
    };
  }

  if (state.view === "courses") {
    const { peopleOnLeave, courses } = selectCourseHistory(context, filters);
    const sections = courses.flatMap(({ sectionsByTerm }) =>
      sectionsOf(sectionsByTerm),
    );
    const peopleByEmplid = selectPeopleByEmplid(context);
    const instructors = sections
      .flatMap(({ instructors }) => instructors)
      .map(({ emplid }) => peopleByEmplid.get(emplid))
      .filter((person): person is PlanningPerson => person !== undefined);

    return {
      people: [...instructors, ...peopleOnLeave.map(({ person }) => person)],
      leaves: peopleOnLeave.flatMap(({ leaves }) => leaves),
      sections,
      isHistoryShown: true,
    };
  }

  const rows = selectPersonHistoryRows(context, state, filters);
  const sections = rows.flatMap(({ sectionsByTerm }) =>
    sectionsOf(sectionsByTerm),
  );
  return {
    people: rows.map(({ person }) => person),
    leaves: rows.flatMap(({ leaves }) => leaves),
    sections: uniqueSections(sections),
    isHistoryShown: true,
  };
}

const withoutFacet = (
  filters: PlanningFilters,
  facet: FilterFacet,
): PlanningFilters => ({ ...filters, [facet]: [] });

export const selectFacetTiles = (
  context: ViewContext,
  state: ViewState,
): FacetTileSummary[] => {
  const allRecords = visibleRecordsOf(context, state, emptyFilters());

  return selectVisibleFacets(context, state).map((facet) => {
    const filtersExceptFacet = withoutFacet(state.filters, facet);
    const reachableRecords = visibleRecordsOf(
      context,
      state,
      filtersExceptFacet,
    );
    return {
      facet,
      reachableCount: filterOptionsFor(facet, reachableRecords).length,
      totalCount: filterOptionsFor(facet, allRecords).length,
      checkedCount: state.filters[facet].length,
    };
  });
};

export const selectActiveFacetOptions = (
  context: ViewContext,
  state: ViewState,
): FilterOption[] => {
  const facet = selectActiveFacet(context, state);
  const filtersExceptFacet = withoutFacet(state.filters, facet);
  const records = visibleRecordsOf(context, state, filtersExceptFacet);
  return filterOptionsFor(facet, records);
};

export const selectActiveFilterCount = (
  context: ViewContext,
  state: ViewState,
): number =>
  selectVisibleFacets(context, state).reduce(
    (count, facet) => count + state.filters[facet].length,
    0,
  );

export const selectSelectedLeave = (
  context: ViewContext,
  state: ViewState,
): PlanningLeave | null => {
  const { selection } = state;
  if (selection?.kind !== "leave") return null;
  const leaves = context.timeline?.leaves ?? [];
  return leaves.find(({ id }) => id === selection.leaveId) ?? null;
};

export const selectSelectedSection = (
  context: ViewContext,
  state: ViewState,
): TeachingSection | null => {
  const { selection } = state;
  if (selection?.kind !== "section") return null;
  if (!selectIsHistoryShown(context, state)) return null;
  const sections = context.teachingHistory?.sections ?? [];
  return sections.find(({ key }) => key === selection.sectionKey) ?? null;
};
