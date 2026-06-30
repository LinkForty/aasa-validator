import type { CheckId, CheckStatus, FetchedFile, ValidationResult } from '../src/types.js';

/** Build a FetchedFile with sensible 200/well-known defaults for tests. */
export function makeFetched(
  body: string | null,
  overrides: Partial<FetchedFile> = {},
): FetchedFile {
  const base: FetchedFile = {
    url: 'https://example.com/.well-known/apple-app-site-association',
    location: 'well-known',
    status: 200,
    redirected: false,
    finalUrl: 'https://example.com/.well-known/apple-app-site-association',
    contentType: 'application/json',
    body,
    byteLength: body == null ? null : new TextEncoder().encode(body).length,
  };
  return { ...base, ...overrides };
}

/** Find a check by id (throws if absent, so tests fail loudly). */
export function checkById(result: ValidationResult, id: CheckId) {
  const found = result.checks.find((c) => c.id === id);
  if (!found) throw new Error(`No check with id "${id}"`);
  return found;
}

/** Assert a check's status. */
export function statusOf(result: ValidationResult, id: CheckId): CheckStatus {
  return checkById(result, id).status;
}
