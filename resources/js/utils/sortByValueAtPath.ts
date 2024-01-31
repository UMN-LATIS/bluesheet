import { get as getValueAtPath } from "lodash-es";

export const sortByValueAtPath =
  (path: string, sortDirection: "asc" | "desc") => (a, b) => {
    const modifier = sortDirection === "desc" ? -1 : 1;

    // path is the key to sort on
    // e.g. 'financeManager.0.user.displayName`
    a = getValueAtPath(a, path) || " ";
    b = getValueAtPath(b, path) || " ";

    if (typeof a === "string" && typeof b === "string") {
      return a.localeCompare(b) * modifier;
    }

    if (a < b) return -1 * modifier;
    if (a > b) return 1 * modifier;
    return 0;
  };
