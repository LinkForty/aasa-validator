import type { FetchedFile, ValidateOptions, ValidationResult } from './types.js';
import { validate } from './validate.js';

const WELL_KNOWN_PATH = '/.well-known/apple-app-site-association';
const ROOT_PATH = '/apple-app-site-association';
const DEFAULT_TIMEOUT_MS = 10_000;
const USER_AGENT = 'AASA-Validator (+https://github.com/LinkForty/aasa-validator)';

export interface FetchOptions {
  /** Per-request timeout in milliseconds (default 10000). */
  timeoutMs?: number;
  /** Custom fetch implementation (defaults to the global `fetch`). */
  fetchImpl?: typeof fetch;
}

/** Reduce arbitrary user input ("https://x.com/path") to a bare host. */
export function normalizeDomain(input: string): string {
  return input
    .trim()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//i, '') // strip scheme
    .replace(/\/.*$/, '') // strip path/query/fragment
    .replace(/:\d+$/, '') // strip port
    .replace(/\.$/, '') // strip trailing dot
    .toLowerCase();
}

interface Attempt {
  url: string;
  status: number | null;
  redirected: boolean;
  finalUrl: string | null;
  contentType: string | null;
  body: string | null;
  byteLength: number | null;
  error?: string;
}

async function attempt(url: string, opts: FetchOptions): Promise<Attempt> {
  const doFetch = opts.fetchImpl ?? fetch;
  try {
    const response = await doFetch(url, {
      redirect: 'follow',
      headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(opts.timeoutMs ?? DEFAULT_TIMEOUT_MS),
    });
    const body = await response.text();
    return {
      url,
      status: response.status,
      redirected: response.redirected,
      finalUrl: response.url || url,
      contentType: response.headers.get('content-type')?.toLowerCase() ?? null,
      body,
      byteLength: new TextEncoder().encode(body).length,
    };
  } catch (err) {
    return {
      url,
      status: null,
      redirected: false,
      finalUrl: null,
      contentType: null,
      body: null,
      byteLength: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Fetch a domain's AASA file. Tries the required `.well-known/` location first,
 * then falls back to the legacy root path. Must run server-side (cross-origin
 * fetches are blocked in browsers).
 */
export async function fetchAASA(domain: string, opts: FetchOptions = {}): Promise<FetchedFile> {
  const host = normalizeDomain(domain);
  const wellKnown = await attempt(`https://${host}${WELL_KNOWN_PATH}`, opts);
  if (wellKnown.status === 200 && wellKnown.body != null) {
    return { ...wellKnown, location: 'well-known' };
  }

  const root = await attempt(`https://${host}${ROOT_PATH}`, opts);
  if (root.status === 200 && root.body != null) {
    return { ...root, location: 'root' };
  }

  // Neither location served a file — report the required (.well-known) attempt.
  return { ...wellKnown, location: null };
}

/** Fetch and validate a domain's AASA file in one call (server-side). */
export async function fetchAndValidate(
  domain: string,
  options: ValidateOptions = {},
  fetchOpts: FetchOptions = {},
): Promise<ValidationResult> {
  const host = normalizeDomain(domain);
  const fetched = await fetchAASA(host, fetchOpts);
  return validate({ domain: host, fetched, options });
}
