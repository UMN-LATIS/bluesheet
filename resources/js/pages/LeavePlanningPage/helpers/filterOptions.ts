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

const plural = (count: number, noun: string) =>
  `${count} ${count === 1 ? noun : `${noun}s`}`;

function countBy<T>(items: T[], keyOf: (item: T) => string[]) {
  const counts = new Map<string, number>();
  for (const item of items) {
    for (const key of new Set(keyOf(item))) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return counts;
}

const option = (
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

export function filterOptionsFor(
  facet: FilterFacet,
  records: VisibleRecords,
): FilterOption[] {
  switch (facet) {
    case "person": {
      const leaveCounts = countBy(records.leaves, (leave) => [
        String(leave.emplid),
      ]);
      const sectionCounts = countBy(records.sections, (section) =>
        section.instructors.map(({ emplid }) => String(emplid)),
      );
      return uniqueBy(records.people, (person) => String(person.emplid))
        .sort(
          (a, b) =>
            a.lastName.localeCompare(b.lastName) ||
            a.firstName.localeCompare(b.firstName),
        )
        .map((person) => {
          const value = String(person.emplid);
          const annotation = records.isHistoryShown
            ? `${sectionCounts.get(value) ?? 0} sec`
            : plural(leaveCounts.get(value) ?? 0, "leave");
          return option(value, nameOf(person), annotation, {
            secondary: person.title,
          });
        });
    }

    case "category": {
      const counts = countBy(records.people, (person) => person.categories);
      return [...counts.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([category, count]) =>
          option(category, category, String(count)),
        );
    }

    case "leaveType": {
      const counts = countBy(records.leaves, (leave) => [leave.type]);
      return [...counts.entries()]
        .map(([type, count]) =>
          option(type, getLeaveTypeLabel(type as PlanningLeave["type"]), String(count)),
        )
        .sort((a, b) => a.label.localeCompare(b.label));
    }

    case "status": {
      const counts = countBy(records.leaves, (leave) => [leave.status]);
      return STATUS_ORDER.filter((status) => counts.has(status)).map(
        (status) =>
          option(status, getLeaveStatusLabel(status), String(counts.get(status)), {
            swatchClass: `tw-bg-${getLeaveStatusColor(status)}`,
          }),
      );
    }

    case "course": {
      const counts = countBy(records.sections, (section) => [
        section.courseCode,
      ]);
      return uniqueBy(records.sections, (section) => section.courseCode)
        .sort((a, b) => a.courseCode.localeCompare(b.courseCode))
        .map((section) =>
          option(
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
          option(component, component, String(count), {
            secondary: labelOfComponent(component),
            swatchClass: colorOfType(component).dot,
          }),
        );
    }
  }
}

export const nameOf = (person: PlanningPerson): string =>
  [person.lastName, person.firstName].filter(Boolean).join(", ") ||
  person.name ||
  String(person.emplid);

function uniqueBy<T>(items: T[], keyOf: (item: T) => string): T[] {
  const seen = new Map<string, T>();
  for (const item of items) {
    if (!seen.has(keyOf(item))) seen.set(keyOf(item), item);
  }
  return [...seen.values()];
}
