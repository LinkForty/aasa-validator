import { check } from '../check.js';
import type { Check, FetchedFile } from '../types.js';

/** Did we get any HTTP response at all? */
export function checkReachable(fetched: FetchedFile): Check {
  if (fetched.status == null) {
    return check(
      'reachable',
      'fail',
      fetched.error
        ? `Could not reach the domain: ${fetched.error}`
        : 'Could not reach the domain.',
    );
  }
  return check('reachable', 'pass', 'The domain responded to the request.');
}

/** Was the file at the required `.well-known/` location? */
export function checkLocation(fetched: FetchedFile): Check {
  switch (fetched.location) {
    case 'well-known':
      return check('location', 'pass', 'Found at /.well-known/apple-app-site-association.');
    case 'root':
      return check(
        'location',
        'warn',
        'Found only at the legacy root path. iOS 13+ requires the file at /.well-known/apple-app-site-association.',
      );
    default:
      return check(
        'location',
        'fail',
        'No file found at /.well-known/apple-app-site-association or the legacy root path.',
      );
  }
}

/** Was the file served over HTTPS (no downgrade to HTTP)? */
export function checkHttps(fetched: FetchedFile): Check {
  const effective = fetched.finalUrl ?? fetched.url;
  if (effective.startsWith('https://')) {
    return check('https', 'pass', 'The file is served over HTTPS.');
  }
  return check('https', 'fail', `The file must be served over HTTPS. Resolved to ${effective}.`);
}

/** Did the request return HTTP 200? */
export function checkStatus(fetched: FetchedFile): Check {
  if (fetched.status === 200) {
    return check('http-status', 'pass', 'The server returned HTTP 200.');
  }
  return check(
    'http-status',
    'fail',
    `Expected HTTP 200 but received ${fetched.status ?? 'no response'}.`,
  );
}

/** Apple's CDN does not follow redirects — the file must be served directly. */
export function checkRedirect(fetched: FetchedFile): Check {
  if (!fetched.redirected) {
    return check('no-redirect', 'pass', 'The file is served without redirects.');
  }
  return check(
    'no-redirect',
    'fail',
    `The request was redirected to ${fetched.finalUrl ?? 'another URL'}. Apple does not follow redirects when fetching the AASA file; serve it directly.`,
  );
}
