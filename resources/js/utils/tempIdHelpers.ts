export function getTempId() {
  const id = Math.floor(Math.random() * 1000000);
  return `TEMPID-${id}`;
}

export function isTempId(id?: unknown) {
  return typeof id === "string" && id.startsWith("TEMPID-");
}
