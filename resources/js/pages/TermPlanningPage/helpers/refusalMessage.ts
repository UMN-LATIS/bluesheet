interface RefusalBody {
  message?: string;
  errors?: Record<string, string[]>;
}

/**
 * What the server said when it refused a write, ready to show. A 422 carries
 * its per-field messages under `errors` and a generic one under `message`,
 * and the field message is the one worth reading. Undefined when the request
 * never reached the server, so the caller supplies its own wording.
 */
export function refusalMessage(refusal: unknown): string | undefined {
  const data = (refusal as { response?: { data?: RefusalBody } }).response
    ?.data;

  return (data?.errors && Object.values(data.errors)[0]?.[0]) ?? data?.message;
}
