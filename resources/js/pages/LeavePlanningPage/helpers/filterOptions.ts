import {
  leaveStatuses,
  type LeaveStatus,
  type PlanningLeave,
  type PlanningPerson,
  type TeachingSection,
} from "@/types";
import {
  getLeaveStatusColor,
  getLeaveStatusLabel,
} from "@/utils/leaveStatusHelpers";
import { getLeaveTypeLabel } from "@/utils/leaveTypeHelpers";
import { colorOfType, labelOfComponent } from "@/utils/meetingTypeColors";
import type { FilterFacet } from "../useLeavePlanningView/types";

export interface FilterOption {
  value: string;
  label: string;
  secondary: string | null;
  annotation: string;
  /** A Tailwind background class for a color swatch. */
  swatchClass: string | null;
}

export interface VisibleRecords {
  people: PlanningPerson[];
  leaves: PlanningLeave[];
  sections: TeachingSection[];
  isHistoryShown: boolean;
}

const STATUS_ORDER: LeaveStatus[] = [
  leaveStatuses.CONFIRMED,
  leaveStatuses.PENDING,
  leaveStatuses.ELIGIBLE,
  leaveStatuses.DEFERRED,
];

const countWithNoun = (count: number, noun: string) =>
  count === 1 ? `1 ${noun}` : `${count} ${noun}s`;

function countBy<T>(items: T[], keysOf: (item: T) => string[]) {
  const counts = new Map<string, number>();
  for (const item of items) {
    for (const key of new Set(keysOf(item))) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return counts;
}

const filterOptionOf = (
  value: string,
  label: string,
  annotation: string,
  extra: Partial<Pick<FilterOption, "secondary" | "swatchClass">> = {},
): FilterOption => ({
  value,
  label,
  annotation,
  secondary: extra.secondary ?? null,
  swatchClass: extra.swatchClass ?? null,
});

export const FACET_LABELS: Record<FilterFacet, string> = {
  person: "People",
  course: "Courses",
  component: "Component",
  category: "Appointment",
  leaveType: "Leave type",
  status: "Status",
};

export function lastFirstNameOf(person: PlanningPerson): string {
  const lastFirst = [person.lastName, person.firstName]
    .filter(Boolean)
    .join(", ");
  return lastFirst || person.name || String(person.emplid);
}

const byLastThenFirstName = (a: PlanningPerson, b: PlanningPerson) =>
  a.lastName.localeCompare(b.lastName) ||
  a.firstName.localeCompare(b.firstName);

function uniqueBy<T>(items: T[], keyOf: (item: T) => string): T[] {
  const itemsByKey = new Map<string, T>();
  for (const item of items) {
    const key = keyOf(item);
    if (itemsByKey.has(key)) continue;
    itemsByKey.set(key, item);
  }
  return [...itemsByKey.values()];
}

function personOptions(records: VisibleRecords): FilterOption[] {
  const leaveCounts = countBy(records.leaves, (leave) => [
    String(leave.emplid),
  ]);
  const sectionCounts = countBy(records.sections, (section) =>
    section.instructors.map(({ emplid }) => String(emplid)),
  );

  return uniqueBy(records.people, (person) => String(person.emplid))
    .sort(byLastThenFirstName)
    .map((person) => {
      const value = String(person.emplid);
      const sectionCount = sectionCounts.get(value) ?? 0;
      const leaveCount = leaveCounts.get(value) ?? 0;
      const annotation = records.isHistoryShown
        ? `${sectionCount} sec`
        : countWithNoun(leaveCount, "leave");
      return filterOptionOf(value, lastFirstNameOf(person), annotation, {
        secondary: person.title,
      });
    });
}

export function filterOptionsFor(
  facet: FilterFacet,
  records: VisibleRecords,
): FilterOption[] {
  switch (facet) {
    case "person":
      return personOptions(records);

    case "category": {
      const counts = countBy(records.people, (person) => person.categories);
      return [...counts.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([category, count]) =>
          filterOptionOf(category, category, String(count)),
        );
    }

    case "leaveType": {
      const counts = countBy(records.leaves, (leave) => [leave.type]);
      return [...counts.entries()]
        .map(([type, count]) => {
          const label = getLeaveTypeLabel(type as PlanningLeave["type"]);
          return filterOptionOf(type, label, String(count));
        })
        .sort((a, b) => a.label.localeCompare(b.label));
    }

    case "status": {
      const counts = countBy(records.leaves, (leave) => [leave.status]);
      return STATUS_ORDER.filter((status) => counts.has(status)).map((status) =>
        filterOptionOf(
          status,
          getLeaveStatusLabel(status),
          String(counts.get(status)),
          { swatchClass: `tw-bg-${getLeaveStatusColor(status)}` },
        ),
      );
    }

    case "course": {
      const counts = countBy(records.sections, (section) => [
        section.courseCode,
      ]);
      return uniqueBy(records.sections, (section) => section.courseCode)
        .sort((a, b) => a.courseCode.localeCompare(b.courseCode))
        .map((section) =>
          filterOptionOf(
            section.courseCode,
            `${section.subject} ${section.catalogNumber}`,
            `${counts.get(section.courseCode)} sec`,
            { secondary: section.title },
          ),
        );
    }

    case "component": {
      const counts = countBy(records.sections, (section) => [
        section.component,
      ]);
      return [...counts.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([component, count]) =>
          filterOptionOf(component, component, String(count), {
            secondary: labelOfComponent(component),
            swatchClass: colorOfType(component).dot,
          }),
        );
    }
  }
}
