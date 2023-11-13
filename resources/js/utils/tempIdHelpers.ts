export function getTempId() {
  return -1 * Math.floor(Math.random() * 1000000);
}

export function isTempId(id?: unknown) {
  return typeof id === "number" && id < 0;
}
