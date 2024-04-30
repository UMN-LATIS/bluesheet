import { ChildGroup, Group } from "@/types";

export function doesGroupHaveSubgroup(
  group: Group | ChildGroup,
  subgroup: Group | ChildGroup,
) {
  return (
    group.child_groups?.some((subgroupItem) => {
      return (
        subgroupItem.id === subgroup.id ||
        doesGroupHaveSubgroup(subgroupItem, subgroup)
      );
    }) ?? false
  );
}
