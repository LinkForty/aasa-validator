import type { ValidateOptions } from './types.js';

/**
 * Build the URL for a backend `/validate` request. Pure (no network), so it is
 * shared by the web component and the React component and is easy to test.
 */
export function buildValidateUrl(
  endpoint: string,
  domain: string,
  options: ValidateOptions = {},
): string {
  const url = new URL(endpoint, 'http://local.invalid');
  url.searchParams.set('domain', domain);
  if (options.appID) url.searchParams.set('appID', options.appID);
  if (options.teamID) url.searchParams.set('teamID', options.teamID);
  if (options.bundleID) url.searchParams.set('bundleID', options.bundleID);
  // Preserve absolute endpoints; only strip the placeholder base for relative ones.
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(endpoint)
    ? url.toString()
    : url.toString().replace('http://local.invalid', '');
}
