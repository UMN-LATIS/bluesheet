import type {
  PlanningLeave,
  PlanningPerson,
  PlanningTermRange,
  TeachingSection,
} from "@/types";
import { axisFor, type TimelineAxis } from "../helpers/timelineAxis";
import {
  courseViewOf,
  leaveRowsOf,
  personHistoryRowsOf,
  type CourseView,
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
  /** Options left once every other facet has narrowed the page. */
  count: number;
  total: number;
  checkedCount: number;
}

export const selectIsHistoryShown = (context: ViewContext, state: ViewState) =>
  state.isHistoryShown && context.canShowHistory;

export const selectVisibleFacets = (
  context: ViewContext,
  state: ViewState,
): FilterFacet[] =>
  selectIsHistoryShown(context, state)
    ? [...FILTER_FACETS]
    : FILTER_FACETS.filter((facet) => !HISTORY_FACETS.includes(facet));

export const selectActiveFacet = (
  context: ViewContext,
  state: ViewState,
): FilterFacet =>
  selectVisibleFacets(context, state).includes(state.activeFacet)
    ? state.activeFacet
    : "person";

export const selectResolvedRange = (
  context: ViewContext,
): PlanningTermRange | null => context.timeline?.range ?? null;

export const selectAxis = (context: ViewContext): TimelineAxis | null => {
  const range = selectResolvedRange(context);
  return range ? axisFor(context.terms, range) : null;
};

export const selectLeaveRows = (
  context: ViewContext,
  filters: PlanningFilters,
): LeaveRow[] =>
  context.timeline ? leaveRowsOf(context.timeline, filters) : [];

export const selectPersonHistoryRows = (
  context: ViewContext,
  state: ViewState,
  filters: PlanningFilters,
): PersonHistoryRow[] =>
  context.teachingHistory && state.view !== "courses"
    ? personHistoryRowsOf(
        context.teachingHistory,
        context.timeline?.leaves ?? [],
        state.view,
        filters,
      )
    : [];

export const selectCourseView = (
  context: ViewContext,
  filters: PlanningFilters,
): CourseView =>
  context.teachingHistory
    ? courseViewOf(context.teachingHistory, context.timeline, filters)
    : { onLeave: [], courses: [] };

export interface RowCounts {
  shown: number;
  total: number;
  noun: "person" | "course";
}

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
      shown: selectCourseView(context, state.filters).courses.length,
      total: selectCourseView(context, emptyFilters()).courses.length,
      noun: "course",
    };
  }

  return {
    shown: selectPersonHistoryRows(context, state, state.filters).length,
    total: selectPersonHistoryRows(context, state, emptyFilters()).length,
    noun: "person",
  };
}

export const selectPlannedTermIds = (context: ViewContext): Set<number> =>
  new Set(
    (context.teachingHistory?.sections ?? [])
      .filter(({ isPlanned }) => isPlanned)
      .map(({ termId }) => termId),
  );

export const selectPeopleByEmplid = (
  context: ViewContext,
): Map<number, PlanningPerson> =>
  new Map(
    [
      ...(context.timeline?.people ?? []),
      ...(context.teachingHistory?.people ?? []),
    ].map((person) => [person.emplid, person]),
  );

function uniqueSections(sections: TeachingSection[]): TeachingSection[] {
  return [
    ...new Map(sections.map((section) => [section.key, section])).values(),
  ];
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
    const { onLeave, courses } = selectCourseView(context, filters);
    const sections = courses.flatMap(({ sectionsByTerm }) =>
      [...sectionsByTerm.values()].flat(),
    );
    const peopleByEmplid = selectPeopleByEmplid(context);
    const instructors = sections
      .flatMap(({ instructors }) => instructors)
      .map(({ emplid }) => peopleByEmplid.get(emplid))
      .filter((person): person is PlanningPerson => person !== undefined);

    return {
      people: [...instructors, ...onLeave.map(({ person }) => person)],
      leaves: onLeave.flatMap(({ leaves }) => leaves),
      sections,
      isHistoryShown: true,
    };
  }

  const rows = selectPersonHistoryRows(context, state, filters);
  return {
    people: rows.map(({ person }) => person),
    leaves: rows.flatMap(({ leaves }) => leaves),
    sections: uniqueSections(
      rows.flatMap(({ sectionsByTerm }) => [...sectionsByTerm.values()].flat()),
    ),
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
): FacetTileSummary[] =>
  selectVisibleFacets(context, state).map((facet) => ({
    facet,
    count: filterOptionsFor(
      facet,
      visibleRecordsOf(context, state, withoutFacet(state.filters, facet)),
    ).length,
    total: filterOptionsFor(
      facet,
      visibleRecordsOf(context, state, emptyFilters()),
    ).length,
    checkedCount: state.filters[facet].length,
  }));

export const selectActiveFacetOptions = (
  context: ViewContext,
  state: ViewState,
): FilterOption[] => {
  const facet = selectActiveFacet(context, state);
  return filterOptionsFor(
    facet,
    visibleRecordsOf(context, state, withoutFacet(state.filters, facet)),
  );
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
  return (
    context.timeline?.leaves.find(({ id }) => id === selection.leaveId) ?? null
  );
};

export const selectSelectedSection = (
  context: ViewContext,
  state: ViewState,
): TeachingSection | null => {
  const { selection } = state;
  if (selection?.kind !== "section" || !selectIsHistoryShown(context, state)) {
    return null;
  }
  return (
    context.teachingHistory?.sections.find(
      ({ key }) => key === selection.sectionKey,
    ) ?? null
  );
};
