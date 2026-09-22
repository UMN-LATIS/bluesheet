export function isHttpUrl(urlString: string): boolean {
  try {
    const { protocol } = new URL(urlString);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}
