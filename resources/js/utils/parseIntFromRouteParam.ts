export function parseIntFromRouteParam(
  param: string | string[] | undefined,
): number | null {
  if (typeof param !== "string") {
    return null;
  }

  const n = Number.parseInt(param);
  return Number.isNaN(n) ? null : n;
}
